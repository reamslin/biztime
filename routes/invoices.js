const express = require("express");
const { route } = require("../app");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

/** GET /invoices */
router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT id, comp_code FROM invoices`
        );

        return res.json({ invoices: results.rows })
    } catch (err) {
        next(err)
    }
})

/** GET /invoices/:id */
router.get("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const results = await db.query(
            `SELECT i.id,
            i.comp_code,
            i.amt,
            i.paid,
            i.add_date,
            i.paid_date,
            c.name,
            c.description
            FROM invoices AS i 
            INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id=$1`, [id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`Could not find invoice with id: ${id}`, 404);
        }
        const data = results.rows[0];
        const invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description
            }
        }
        return res.json({ invoice: invoice })
    } catch (err) {
        next(err)
    }
})

/** POST /invoices */
router.post("/", async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
        );

        return res.status(201).json({ invoice: results.rows[0] })
    } catch (err) {
        next(err)
    }
});

/** PATCH /invoices/:id */
router.patch("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        let results;
        if (Boolean(paid)) {
            results = await db.query(
                `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3
                WHERE id=$4
                RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                [amt, Boolean(paid), new Date(), id]
            );
        } else {
            results = await db.query(
                `UPDATE invoices SET amt=$1
                WHERE id=$2
                RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                [amt, id]
            );
        }
        if (results.rows.length === 0) {
            throw new ExpressError(`Could not find invoice with id: ${id}`, 404)
        }
        return res.json({ invoice: results.rows[0] })
    } catch (err) {
        next(err)
    }
})

/** DELETE /invoices/[id] */
router.delete("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const check = await db.query(
            `SELECT * FROM invoices WHERE id=$1`, [id]
        );
        if (check.rows.length === 0) {
            throw new ExpressError(`Could not find invoice with id: ${id}`, 404)
        }
        const results = await db.query(
            `DELETE FROM invoices WHERE id=$1`, [id]
        );
        return res.json({ status: "deleted" })
    } catch (err) {
        next(err)
    }
})





module.exports = router