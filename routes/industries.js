const express = require("express");
const { route } = require("../app");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify")

router.get("/", async function (req, res, next) {
    try {
        const industries = await db.query(
            `SELECT * FROM industries`
        );
        let results = [];
        for (i of industries.rows) {
            const companiesResults = await db.query(
                `SELECT comp_code FROM industries_companies
                WHERE ind_code='${i.code}'`
            )
            const companies = companiesResults.rows.map(c => c.comp_code)
            results.push({
                field: i.field,
                companies: companies
            })
        }

        return res.json({ industries: results })
    } catch (err) {
        next(err)
    }
})

router.post("/", async function (req, res, next) {
    try {
        const { code, field } = req.body;
        const results = await db.query(
            `INSERT INTO industries
            VALUES ($1, $2)
            RETURNING *
            `, [code, field]
        );
        return res.status(201).json({ industry: results.rows[0] });
    } catch (err) {
        next(err)
    }
});

router.post("/:indCode", async function (req, res, next) {
    try {
        const { indCode } = req.params;
        const { company } = req.body;

        const companyResults = await db.query(`
        SELECT code FROM companies
        WHERE name=$1`, [company]);
        if (companyResults.rows.length === 0) {
            throw new ExpressError(`No company found with name: ${company}`, 404)
        }
        const compCode = companyResults.rows[0].code;

        const industryResults = await db.query(`
        SELECT field FROM industries
        WHERE code=$1`, [indCode]);
        if (industryResults.rows.length === 0) {
            throw new ExpressError(`No industry found with code: ${indCode}`, 404)
        }
        const indField = industryResults.rows[0];

        const results = await db.query(`
        INSERT INTO industries_companies
        VALUES ($1, $2)
        `, [indCode, compCode]
        );
        return res.status(201).json({
            association: {
                company: company,
                industry: indField
            }
        });
    } catch (err) {
        next(err)
    }
});

module.exports = router;