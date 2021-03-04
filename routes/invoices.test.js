process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async function () {
    let compResult = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('handms', 'hats and maybe scarves', 'We make hats. maybe we make scarves')
    RETURNING code, name, description`);
    testCompany = compResult.rows[0];

    let invResult = await db.query(`
    INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('${testCompany.code}', 3000, false, null)
    RETURNING *`);
    testInvoice = invResult.rows[0];
});

afterEach(async function () {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll(async function () {
    await db.end();
});

describe("GET /invoices", function () {
    test("Gets a list of 1 invoice", async function () {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: [{
                id: testInvoice.id,
                comp_code: testInvoice.comp_code
            }]
        });
    });
});

describe("GET /invoices/:id", function () {
    test("Gets a single invoice", async function () {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoice: {
                id: testInvoice.id,
                amt: testInvoice.amt,
                paid: testInvoice.paid,
                add_date: expect.any(String),
                paid_date: testInvoice.paid_date,
                company: testCompany
            }
        });
    });

    test('Responds with 404 if cannot find invoice', async function () {
        const respone = await request(app).get(`/invoices/0`);
        expect(respone.statusCode).toEqual(404);
    });
});

describe("POST /invoices", function () {
    test("Create a new invoice", async function () {
        const response = await request(app)
            .post(`/invoices`)
            .send({
                comp_code: testCompany.code,
                amt: 5000
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: testInvoice.comp_code,
                amt: 5000,
                paid: testInvoice.paid,
                add_date: expect.any(String),
                paid_date: testInvoice.paid_date
            }
        });
    });
});

describe("PATCH /invoices/:id", function () {
    test("Updates a single invoice", async function () {
        const response = await request(app)
            .patch(`/invoices/${testInvoice.id}`)
            .send({
                amt: 4,
                paid: false
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: testInvoice.comp_code,
                amt: 4,
                paid: testInvoice.paid,
                add_date: expect.any(String),
                paid_date: testInvoice.paid_date
            }
        });
    });

    test("Responds with 404 if invoice not found", async function () {
        const response = await request(app).patch(`/invoices/464`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /invoices/:id", function () {
    test("Deletes a single invoice", async function () {
        const reponse = await request(app)
            .delete(`/invoices/${testInvoice.id}`);
        expect(reponse.statusCode).toEqual(200);
        expect(reponse.body).toEqual({
            status: "deleted"
        });
    });

    test("Responds with 404 if not found", async function () {
        const response = await request(app)
            .delete(`/invoices/0`);
        expect(response.statusCode).toEqual(404);
    });
});