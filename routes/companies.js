const express = require("express");
const { route } = require("../app");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


/** GET /companies */
router.get("/", async function (req, res, next) {
    const results = await db.query(
        `SELECT * FROM companies`
    )
    return res.json({ companies: results.rows })
})

/** GET /companies/[code] */
router.get("/:code", async function (req, res, next) {
    try {
        const { code } = req.params
        const results = await db.query(
            `SELECT * FROM companies WHERE code=$1`, [code]
        )
        const invoicesResults = await db.query(
            `SELECT id FROM invoices 
            WHERE comp_code=$1`, [code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`Could not find company with code: ${code}`, 404)
        }
        const company = results.rows[0]
        const invoices = invoicesResults.rows
        company.invoices = invoices.map(inv => inv.id);
        return res.json({ company: company })
    } catch (err) {
        next(err)
    }
})

/** POST /companies */
router.post("/", async function (req, res, next) {
    try {
        const { code, name, description } = req.body;
        const results = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description `, [code, name, description]
        );

        return res.status(201).json({ company: results.rows[0] })
    } catch (err) {
        next(err)
    }
})

/** PATCH /companies/[code] */
router.patch("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`, [name, description, code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`Could not find company with code: ${code}`, 404)
        }

        return res.json({ company: results.rows[0] })
    } catch (err) {
        next(err)
    }
})

/** DELETE /companies/[code] */
router.delete("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const check = await db.query(
            `SELECT * FROM companies WHERE code=$1`, [code]
        )
        if (check.rows.length === 0) {
            throw new ExpressError(`Could not find company with code: ${code}`, 404)
        }
        const results = await db.query(
            `DELETE FROM companies WHERE code=$1`, [code]
        );
        return res.json({ status: "deleted" })
    } catch (err) {
        next(err)
    }
})





module.exports = router