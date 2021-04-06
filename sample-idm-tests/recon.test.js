describe('recon.js', function() {
    const recon = require('recon.js');

    describe('findReconDetail', function() {
        it('should return a specified resource', function() {
            // Given a request that specifies the resource path of a known node of the recon tree
            const request = {
                resourcePath: "managedOrgunit_oracleorggroups_link_parents"
            }

            const reconDetail = {
                _id: "main",
                name: "Link Oracle Org Units to their parent Org Unit",
                mapping: "managedOrgunit_oracleorggroups_link_parents",
                description: "",
                downstream: [
                    {
                        name: "Sync Managed Users to Oracle Staff",
                        mapping: "managedUser_systemOraclestaff__ACCOUNT__",
                        description: "Only applies to permanent Staff",
                        downstream: []
                    }
                ]
            }

            // When the request for that resource path is made
            const result = recon.findReconDetail(request);

            // Then the result is the node in question
            expect(result).toEqual(reconDetail);
        });

        it('should return a specified resource when the main pipeline is specified', function() {
            // Given a request that specifies the resource path of a known node of the recon tree specifying the main pipeline
            const request = {
                resourcePath: "managedOrgunit_oracleorggroups_link_parents",
                additionalParameters: {
                    pipelineName: "main"
                }
            }

            const reconDetail = {
                _id: "main",
                name: "Link Oracle Org Units to their parent Org Unit",
                mapping: "managedOrgunit_oracleorggroups_link_parents",
                description: "",
                downstream: [
                    {
                        name: "Sync Managed Users to Oracle Staff",
                        mapping: "managedUser_systemOraclestaff__ACCOUNT__",
                        description: "Only applies to permanent Staff",
                        downstream: []
                    }
                ]
            }

            // When the request for that resource path is made
            const result = recon.findReconDetail(request);

            // Then the result is the node in question
            expect(result).toEqual(reconDetail);
        });

        it('should allow different pipelines', function() {
            // Given a request that specifies the resource path of a known node of the adTestSync pipline
            const request = {
                resourcePath: "SyncProdADGroupstoTestAdGroups",
                additionalParameters: {
                    pipelineName: "adTestSync"
                }
            }

            const reconDetail = {
                "_id": "adTestSync",
                "name": "Sync prod.lan AD Groups with test.lan AD",
                "mapping": "SyncProdADGroupstoTestAdGroups",
                "description": "",
                "downstream": [
                    {
                        "name": "Add members to the test.lan AD Groups from prod.lan",
                        "mapping": "SyncProdADGroupstoTestAdGroups_link_members",
                        "description": "",
                        "downstream": []
                    }
                ]
            }

            // When the request for that resource path is made
            const result = recon.findReconDetail(request);

            // Then the result is the node in question
            expect(result).toEqual(reconDetail);
        });

        it('should return the top level resource if no path is specified', function() {
            // Given a request that does not specify a resource path
            const request = {}

            // When the request for that resource path is made
            const result = recon.findReconDetail(request);

            // Then the result is the node in question
            expect(result.mapping).toEqual("systemOrgunits__ACCOUNT___managedOrgunit");
        });
    });
});
