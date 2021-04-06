describe("common.js:", function() {
	const common = require('common');

	describe("getBaseDN; Getting the base DN", function() {

		it("reads the base DN from an IDM property", function() {
			// Given AD configuration that can be read from openidm
			withSpy(identityServer.getProperty).returnValue("DC=content-after-department");

			// When the base DN is requested
			const baseDN = common.getBaseDN();

			// Then the AD configuration was fetched from openidm
			expect(identityServer.getProperty.calls.count()).toEqual(1);
			// and the result is the remaining parts of the principal after "Department"
			expect(baseDN).toBe("DC=content-after-department");
		});
	});

	describe("escapeCN; Escaping a string to use as CN", function() {
		it("should replace unsupported characters with underscores", function() {
			// Given an input string with many unsupported characters
			const input = "a+string/with,many;unsupported\"characters<#>"

			// When the string is escaped to be used as a CN
			const output = common.escapeCN(input);

			// Then the output should be of the same length, but with all unsupported characters
			// replaced with underscores
			expect(output.length).toBe(input.length);
			expect(output).toBe("a_string_with_many_unsupported_characters___");
		});
	});

	describe("prepareRelationshipRef; preparing a relationship reference", function() {
		it("should create a new reference if there is no existing one", function() {
			// Given a managed object with a relationship field
			const managedObject = "/managed/my_object"
			const relationshipField = "myRelationship";

			// And a reference to an object to link to
			const ref = "my_ref";

			// And an openidm reference that returns no matching relationship
			withSpy(openidm.read).returnValue(null);

			// When a relationship is prepared
			const result = common.prepareRelationshipRef(managedObject, relationshipField, ref);

			// Then the reference was requested from openidm
			expect(openidm.read.calls.count()).toEqual(1);
			expect(openidm.read).toHaveBeenCalledWith(
				managedObject, null, ["myRelationship/_ref"]
			);

			// And the result is a newly created reference
			expect(result).toEqual({ "_ref": ref });
		});

		it("should return an existing relationship with the new ref if one is found", function(){
			// Given a managed object with a relationship field
			const managedObject = "/managed/type/my_object"
			const relationshipField = "myRelationship";

			// And a reference to an object to link to
			const ref = "/managed/new/ref";

			// And an openidm reference that returns an object with an existing relationship
			const existingObject = {
				_id: "my_object",
				_rev: 123,
				myRelationship: {
					_ref: "managed/existing/ref",
					_refProperties: {
						_id: "12345678-abcd-1234-dcba-00000000000",
						_rev: 321
					}
				}
			};
			withSpy(openidm.read).returnValue(existingObject);

			// When a relationship is prepared
			const result = common.prepareRelationshipRef(managedObject, relationshipField, ref);

			// Then the reference was requested from openidm
			expect(openidm.read.calls.count()).toEqual(1);
			expect(openidm.read).toHaveBeenCalledWith(
				managedObject, null, ["myRelationship/_ref"]
			);

			// And the result is the existing relationship, updated with the ref
			expect(result).toEqual(_.assign(existingObject.myRelationship, {
				_ref: ref
			}));
		});

	});

	describe("stringHasValue; testing a string", function() {
		[ // Input      Expected
			[null,      false],
			[undefined, false],
			["",        false],
			[" ",       false],
			["text",    true]
		].forEach(function([input, expected]) {
			it("should return " + expected + " for " + JSON.stringify(input), function() {
				expect(common.stringHasValue(input)).toEqual(expected);
			})
		});

	});

	describe("delete related relationships for managed object", function() {
		it("should delete relationships found in query", function() {
			const relResponse = {
				"result": [
					{
						"_id": "123e4567-e89b-12d3-a456-426655440000",
						"_rev": "0",
						"firstResourceCollection": "managed/user",
						"firstResourceId": "user1234",
						"secondResourceCollection": "managed/OrgUnit",
						"secondResourceId": "1234",
						"firstPropertyName": "orgunit",
						"secondPropertyName": null,
						"properties": null
					}
				],
				"resultCount": 1,
				"pagedResultsCookie": null,
				"totalPagedResultsPolicy": "NONE",
				"totalPagedResults": -1,
				"remainingPagedResults": -1
			}

			withSpy(openidm.query).returnValue(relResponse);

			common.deletedRelatedRelationshipsForManagedObject("managed/OrgUnit/1234");

			expect(openidm.delete).toHaveBeenCalledWith("repo/relationships/123e4567-e89b-12d3-a456-426655440000", null);
		});

		it("should do nothing when no relationships found in query", function() {
			const relResponse = {
				"result": [],
				"resultCount": 0,
				"pagedResultsCookie": null,
				"totalPagedResultsPolicy": "NONE",
				"totalPagedResults": -1,
				"remainingPagedResults": -1
			}

			withSpy(openidm.query).returnValue(relResponse);

			common.deletedRelatedRelationshipsForManagedObject("managed/OrgUnit/1234");

			expect(openidm.delete).not.toHaveBeenCalled();
		});
	});

});