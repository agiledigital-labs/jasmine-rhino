describe("users.js:", function() {
    const mocks = {
        common: jasmine.createSpyObj('common', ['escapeCN', 'getBaseDN', 'prepareRelationshipRef']),
    };
    const users = require('users');


    describe("convertStringToInteger", function() {
        [ // Input      Expected
            ["123",     123],
            ["0",       0],
            ["01",      null],
            ["one",     null],
            ["1.0",     null],
            ["text",    null]
        ].forEach(function([input, expected]) {
            it("should return " + expected + " for " + JSON.stringify(input), function() {
                expect(users.convertStringToInteger(input)).toEqual(expected);
            })
        });
    });

    describe('linkManager', function() {
        it('should return the manager reference', function() {
            // Given a source user containing an HRSystem id for their manager
            const source = {
                UNumber: '[U NUMBER]',
                EmpsActualPosNo: '1234',
                ManagersHRSystemNumber: '[MANAGER HRSYSTEM NUMBER]'
            }
            // And an openidm reference that can query for the manager
            withSpy(openidm.query).returnValue({
                result: [{ _id: '[MANAGER ID]' }]
            })
            // And a common service that can prepare a ref
            withSpy(mocks.common.prepareRelationshipRef).returnValue('[PREPARED RELATIONSHIP REF]')

            // When the manager link is created
            const result = withMocks(mocks, function() {
                return users.linkManager(source);
            });

            // Then a query is made with the manager's HRSystem id
            expect(openidm.query).toHaveBeenCalledWith("managed/user", {
                _queryFilter: 'hrSystemEmpId eq "[MANAGER HRSYSTEM NUMBER]"'
            })
            // And a ref is prepared between the resulting manager and the original user
            expect(mocks.common.prepareRelationshipRef).toHaveBeenCalledWith(
                "managed/user/[U NUMBER]",
                "manager",
                "managed/user/[MANAGER ID]"
            );
            // And the prepared ref is returned
            expect(result).toBe('[PREPARED RELATIONSHIP REF]')
        });


        it('should not return a manager for the ceo', function() {
            // Given a source user containing an HRSystem id for their manager
            const source = {
                UNumber: '[U NUMBER]',
                EmpsActualPosNo: '12857',
                ManagersHRSystemNumber: '[MANAGER HRSYSTEM NUMBER]'
            }

            // When the manager link is created
            const result = withMocks(mocks, function() {
                return users.linkManager(source);
            });

            // Then the result is null
            expect(result).toBe(null)
        });
    });

    describe('managerExists', function() {
        it('should return true if a user with a manager can be read', function() {
            // Given a source user who has a manger
            const source = {
                _id: '[SOURCE ID]',
                hrSystemEmpId: '[SOURCE HR EMP ID]'
            }
            // And an openidm reference that can fetch the user
            withSpy(openidm.read).returnValue({
                manager: {
                    dn: ['MANAGER DN']
                }
            })

            // When the user is checked for a manager
            const result = users.managerExists(source);

            // Then the user is fetched
            expect(openidm.read).toHaveBeenCalledWith("managed/user/[SOURCE ID]", null, ["manager/dn"]);

            // And the result is true
            expect(result).toBe(true);
        });

        it('should return false if a user with no manager can be read', function() {
            // Given a source user who has no manger
            const source = {
                _id: '[SOURCE ID]',
                hrSystemEmpId: '[SOURCE AEI]'
            }
            // And an openidm reference that can fetch the user
            withSpy(openidm.read).returnValue({
                manager: null
            })

            // When the user is checked for a manager
            const result = users.managerExists(source);

            // Then the user is fetched
            expect(openidm.read).toHaveBeenCalledWith("managed/user/[SOURCE ID]", null, ["manager/dn"]);

            // And the result is false
            expect(result).toBe(false);
        });

        it('should return false if the source is not APS', function() {
            // Given a source user who has no manger
            const source = {
                _id: '[SOURCE ID]',
                hrSystemEmpId: null
            }

            // When the user is checked for a manager
            const result = users.managerExists(source);

            // And the result is false
            expect(result).toBe(false);
        });
    });

    describe('deactivateManagedUser', function() {
        it('should set the managed user to inactive and unlink', function() {
            const originalUser = {
                _id: '[username]',
                accountStatus: 'active'
            }
            const updatedUser = {
                _id: '[username]',
                accountStatus: 'inactive'
            }

            const result = users.deactivateManagedUser(originalUser);

            expect(openidm.update).toHaveBeenCalledWith("managed/user/[username]", null, updatedUser)

            expect(result).toBe("UNLINK");
        });
    });
});

