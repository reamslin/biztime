process.env.NODE_ENV = "test";

const request = require("supertest");
const slugify = require("slugify");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
    let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('handms', 'hats and maybe scarves', '${slugify('hats and maybe scarves')}')
    RETURNING code, name, description`);
    testCompany = result.rows[0];
});

afterEach(async function () {
    await db.query(`DELETE FROM companies`)
});

afterAll(async function () {
    await db.end();
});

describe("GET /companies", function () {
    test("Gets a list of 1 company", async function () {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [testCompany]
        });
    });
});

describe("GET /companies/:code", function () {
    test("Gets a single company", async function () {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: testCompany.code,
                name: testCompany.name,
                description: testCompany.description,
                invoices: [],
                industries: []
            }
        });
    });

    test('Responds with 404 if cannot find company', async function () {
        const respone = await request(app).get(`/companies/no`);
        expect(respone.statusCode).toEqual(404);
    });
});

describe("POST /companies", function () {
    test("Create a new company", async function () {
        const response = await request(app)
            .post(`/companies`)
            .send({
                name: 'new taste good',
                description: 'yummy chinese'
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: slugify('new taste good'),
                name: 'new taste good',
                description: 'yummy chinese'
            }
        });
    });
});

describe("PATCH /companies/:code", function () {
    test("Updates a single company", async function () {
        const response = await request(app)
            .patch(`/companies/${testCompany.code}`)
            .send({
                name: "new name",
                description: "new description"
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: testCompany.code,
                name: "new name",
                description: "new description"
            }
        });
    });

    test("Responds with 404 if company not found", async function () {
        const response = await request(app).patch(`/companies/no`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", function () {
    test("Deletes a single company", async function () {
        const reponse = await request(app)
            .delete(`/companies/${testCompany.code}`);
        expect(reponse.statusCode).toEqual(200);
        expect(reponse.body).toEqual({
            status: "deleted"
        });
    });

    test("Responds with 404 if not found", async function () {
        const response = await request(app)
            .delete(`/companies/no`);
        expect(response.statusCode).toEqual(404);
    });
});