describe("groups.js:", function() {
	const groups = require('groups');

	const baseGroup = {
		_id: "ORG_1234",
		_rev: 10,
		cn: "ORG_1234 TEST",
		dn: "CN=ORG_1234 TEST,OU=Groups,DC=UnitTests",
		member: ["CN=member1", "CN=member2", "CN=member3"]
	};

	const disabledGroups = "OU=Disabled Groups";

	const timestampRegex = "\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d\\";

	describe("filterGroupsForExistingOnly; Filtering a groups members to those that exist in AD", function() {
		it("should return an empty array if the group has no members", function() {
			// Given a group with no members
			const group = _.assign({}, baseGroup, {
				member: []
			});

			// When applying the filter
			const result = groups.filterGroupsForExistingOnly(group);

			// Then the result is an empty array
			expect(result).toEqual([]);
		});

		it("should query each member and only return those that exist in AD", function() {
			// Given a group with existing members
			const group = _.assign({}, baseGroup, {
				member: [
					"CN=member_in_ad1",
					"CN=missing_member1",
					"CN=missing_member2",
					"CN=member_in_ad2"
				]
			});

			// And an openidm reference that returns data for members that are in ad
			withSpy(openidm.query).callFake(function(resourceName, query) {
				if(_.contains(query._queryFilter, "missing_member")) {
					// Empty result for members with "missing_member" in their name
					return { result: [] }
				}
				else {
					// Result for other members
					return { result: [{}] }
				}
			})

			// When applying the filter
			const result = groups.filterGroupsForExistingOnly(group);

			// Then the result is an empty array
			expect(result).toEqual(["CN=member_in_ad1", "CN=member_in_ad2"]);
		});

		it("should look for members as groups for organisational groups", function() {
			// Given a group with existing members
			const group = baseGroup;

			// And an openidm reference that returns  of each member
			withSpy(openidm.query).returnValue({ result: [{}] });

			// When applying the filter
			const result = groups.filterGroupsForExistingOnly(group);

			// Then all queries to AD looked for groups
			const args = openidm.query.calls.allArgs();
			args.forEach(function([resourceName, query]) {
				expect(resourceName).toBe("system/ActiveDirectory/group");
			});
		});

		it("should look for users rather than groups within positions", function() {
			// Given a group with existing members
			const group = _.assign({}, baseGroup, {
				cn: "POS_1234 Position",
			});

			// And an openidm reference that returns  of each member
			withSpy(openidm.query).returnValue({ result: [{}] });

			// When applying the filter
			const result = groups.filterGroupsForExistingOnly(group);

			// Then all queries to AD looked for groups
			const args = openidm.query.calls.allArgs();
			args.forEach(function([resourceName, query]) {
				expect(resourceName).toBe("system/ActiveDirectory/account");
			});
		});

	});

	describe("calculateADActionForSourceMissing; handling the deletion of AD groups", function() {
		it("should flag the group as disabled", function() {
			// Given a group to be deleted
			const group = _.cloneDeep(baseGroup);

			// When the change is pushed to AD
			const result = groups.calculateADActionForSourceMissing(null, group, null, null);

			// Then the returned signal is UNLINK
			expect(result).toBe("UNLINK");

			// And a call to openidm was made to update the group
			expect(openidm.update.calls.count()).toBe(1);
			const [resourceName, params, updatedGroup] = openidm.update.calls.argsFor(0)

			// And the call references the existing object, setting CN to describe the removal date, and
			// changing the OU to Disabled Groups
			expect(resourceName).toBe("system/ActiveDirectory/group/ORG_1234");
			expect(updatedGroup.cn).toMatch(baseGroup.cn + " \\[rm " + timestampRegex + "]");
			expect(updatedGroup.dn).toBe("CN=" + updatedGroup.cn + ",OU=Disabled Groups,DC=UnitTests");
		});
	});


	describe("isValidGroup; testing if a group is valid", function() {
		it("should return true if the OU is not the disabled OU", function() {
			// Given a group in a regular OU
			const group = _.assign({}, baseGroup, {
				dn: "CN=any,OU=Anything Enabled,DC=UnitTests"
			});

			// When the group is tested
			const result = groups.isValidGroup(group);

			// It is found to be valid
			expect(result).toBe(true);
		});

		it("should return false if the OU is the disabled OU", function() {
			// Given a group in a regular OU
			const group = _.assign({}, baseGroup, {
				dn: "CN=any,OU=Disabled Groups,DC=UnitTests"
			});

			// When the group is tested
			const result = groups.isValidGroup(group);

			// It is found to be valid
			expect(result).toBe(false);
		});
	});

	describe("maintainExistingMemberOrdering; ensuring only necessary member changes are made", function() {
		it("should use the ordering of the existing group if the members are the same", function() {
			// Given an existing group with a given member order
			const members = ["a", "b", "c", "d"];
			const oldGroup = _.assign({}, baseGroup, {
				member: members
			});

			// And a new group with the same members in a new order
			const shuffled = ["b", "d", "a", "c"];
			const newGroup = _.assign({}, baseGroup, {
				cn: "ORG_NEW",
				member: shuffled
			});

			// When the groups are passed to the ordering method
			groups.maintainExistingMemberOrdering(newGroup, oldGroup);

			// The new group is updated to reflect the existing order
			expect(newGroup.member).toEqual(members);
		});


		it("should use the ordering of the new group if there are any differences", function() {
			// Given an existing group with a given member order
			const members = ["a", "b", "c", "d"];
			const oldGroup = _.assign({}, baseGroup, {
				member: members
			});

			// And a new group with the same members in a new order
			const shuffled = ["b", "d", "a", "c", "x"];
			const newGroup = _.assign({}, baseGroup, {
				cn: "ORG_NEW",
				member: shuffled
			});

			// When the groups are passed to the ordering method
			groups.maintainExistingMemberOrdering(newGroup, oldGroup);

			// The new group is updated to reflect the existing order
			expect(newGroup.member).toEqual(shuffled);
		});
	});

});