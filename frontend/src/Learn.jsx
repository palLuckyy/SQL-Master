// Learn.jsx — Full SQL Curriculum (13 lessons, 5 levels, MCQ quizzes)
import { useState } from "react";

const T = {
  bg:"#080c14", sidebar:"#0d1220", surface:"#111827", card:"#151f30",
  cardHov:"#1a2640", border:"#1e2d45", border2:"#243350", accent:"#38bdf8",
  purple:"#8b5cf6", green:"#22c55e", orange:"#f59e0b", red:"#ef4444",
  pink:"#ec4899", muted:"#334155", text:"#e2e8f0", dim:"#64748b", dim2:"#94a3b8",
};

const Pill = ({ label, color }) => (
  <span style={{ background:color+"1a", color, border:`1px solid ${color}33`,
    padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
    letterSpacing:".5px", whiteSpace:"nowrap" }}>{label}</span>
);

const Btn = ({ children, onClick, color=T.accent, outline=false, disabled=false, small=false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline?"transparent":(disabled?T.muted:color),
    color: outline?color:(disabled?T.dim:"#000"),
    border:`2px solid ${disabled?T.muted:color}`,
    padding: small?"6px 14px":"9px 20px", borderRadius:8,
    fontWeight:700, cursor:disabled?"not-allowed":"pointer",
    fontSize:small?12:13, transition:"all .15s"
  }}>{children}</button>
);

// ─── CURRICULUM DATA ──────────────────────────────────────────────────────────
export const CURRICULUM = [
  { lv:1, title:"SQL Fundamentals", color:T.green, icon:"🌱", lessons:[
    { id:"l1", title:"What is SQL?", dur:"8 min",
      concepts:[
        { icon:"🗄️", title:"SQL = Structured Query Language", body:"SQL lets you talk to databases. Think of a database as a giant Excel spreadsheet, and SQL is how you ask it questions or change its data.", color:T.green },
        { icon:"📋", title:"What is a Table?", body:"Data lives in tables — rows are records (one customer), columns are fields (name, email, phone). Our dataset is called customers_raw.", color:T.accent },
        { icon:"⚙️", title:"Basic Query Structure", body:"Every SQL query follows this order: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT. You don't need all of them — just what you need!", color:T.purple },
      ],
      visual:{ type:"table", caption:"Sample customers_raw data", headers:["customer_id","first_name","email","state","segment"], rows:[["C001","Alice","alice@email.com","NY","Premium"],["C002","Bob","bob@mail.com","CA","Basic"],["C003","Carol","carol@test.com","TX","Premium"]] },
      annotated:[
        { label:"Step 1 — Choose columns", code:"SELECT first_name, email", note:"Pick which columns to show" },
        { label:"Step 2 — Pick the table", code:"FROM customers_raw", note:"Tell SQL where the data lives" },
        { label:"Step 3 — Filter rows", code:"WHERE state = 'NY'", note:"Only rows matching this condition" },
        { label:"Step 4 — Sort results", code:"ORDER BY last_name", note:"Arrange output alphabetically" },
        { label:"Step 5 — Limit output", code:"LIMIT 10;", note:"Show only first 10 rows" },
      ],
      mcq:[
        { q:"What does SQL stand for?", opts:["Structured Query Language","Simple Query Logic","Sequential Question List","Structured Question Lookup"], ans:0, exp:"SQL = Structured Query Language. It's the standard language for managing and querying relational databases." },
        { q:"In a database table, what does each ROW represent?", opts:["A column header","A single record (e.g. one customer)","The database name","A SQL function"], ans:1, exp:"Each row is one record — like one customer's full set of data across all columns." },
        { q:"Which clause tells SQL WHERE the data lives?", opts:["SELECT","WHERE","FROM","LIMIT"], ans:2, exp:"FROM tells SQL which table to read. SELECT picks the columns, FROM picks the table." },
        { q:"What is the correct order of a basic SQL query?", opts:["FROM → SELECT → WHERE","WHERE → FROM → SELECT","SELECT → FROM → WHERE","SELECT → WHERE → FROM"], ans:2, exp:"The standard order is SELECT (what columns) → FROM (which table) → WHERE (filter rows)." },
        { q:"What does LIMIT 5 do in a query?", opts:["Filters rows by a condition","Returns only the first 5 rows","Sorts rows by a column","Removes duplicate rows"], ans:1, exp:"LIMIT restricts how many rows come back. LIMIT 5 = show only the top 5 results." },
      ]
    },
    { id:"l2", title:"SELECT & FROM", dur:"10 min",
      concepts:[
        { icon:"🔍", title:"SELECT — Choose Your Columns", body:"SELECT is the first word in nearly every query. List column names separated by commas, or use * to get everything.", color:T.accent },
        { icon:"🏷️", title:"Column Aliases with AS", body:"Rename any column in your output using AS. The original table is unchanged — it's just for display. Great for cleaner reports.", color:T.green },
        { icon:"✨", title:"DISTINCT — Remove Duplicates", body:"DISTINCT returns only unique values. If 50 customers are in 'NY', DISTINCT state returns 'NY' just once.", color:T.purple },
      ],
      visual:{ type:"compare", caption:"SELECT * vs SELECT specific columns", left:{ label:"SELECT *  (all columns)", cols:["id","first","last","email","phone","state","segment","income","..."] }, right:{ label:"SELECT first_name, email  (specific)", cols:["first_name","email"] } },
      annotated:[
        { label:"Select everything", code:"SELECT * FROM customers_raw;", note:"* means all columns — useful for exploring but slow on big tables" },
        { label:"Select specific columns", code:"SELECT first_name, last_name, email\nFROM customers_raw;", note:"Name only what you need — faster and cleaner" },
        { label:"Create aliases", code:"SELECT first_name AS \"First Name\",\n       email AS \"Email Address\"\nFROM customers_raw;", note:"AS renames the column in your output" },
        { label:"Combine columns", code:"SELECT first_name || ' ' || last_name AS full_name\nFROM customers_raw;", note:"|| is the concatenation operator in PostgreSQL" },
        { label:"Unique values only", code:"SELECT DISTINCT customer_segment\nFROM customers_raw;", note:"Returns each segment name exactly once" },
      ],
      mcq:[
        { q:"What does SELECT * mean?", opts:["Select nothing","Select the first column","Select all columns","Select only numeric columns"], ans:2, exp:"The asterisk (*) is a wildcard that means 'all columns'. It's convenient but can be slow on large tables." },
        { q:"How do you rename a column in your output?", opts:["RENAME col TO name","SELECT col AS name","col = name","LABEL col name"], ans:1, exp:"The AS keyword creates an alias — it renames the column in your result but doesn't change the actual table." },
        { q:"What does DISTINCT do?", opts:["Sorts rows alphabetically","Returns only unique/different values","Removes NULL rows","Counts rows"], ans:1, exp:"DISTINCT removes duplicate values from your results. SELECT DISTINCT state returns each state only once." },
        { q:"In PostgreSQL, which operator concatenates (joins) two strings?", opts:["+ operator",", comma","|| double pipe","& ampersand"], ans:2, exp:"PostgreSQL uses || to join strings. 'Hello' || ' ' || 'World' returns 'Hello World'." },
        { q:"Which query is most efficient when you only need name and email?", opts:["SELECT * FROM customers_raw","SELECT name, email FROM customers_raw","SELECT ALL FROM customers_raw","SELECT 1 FROM customers_raw"], ans:1, exp:"Always select only the columns you need. SELECT * fetches unnecessary data and is slower on large tables." },
      ]
    },
    { id:"l3", title:"WHERE Clause", dur:"12 min",
      concepts:[
        { icon:"🎯", title:"WHERE Filters Rows", body:"WHERE is your filter. Only rows where the condition is TRUE are included. Think of it as a bouncer at a door — only matching rows get in.", color:T.red },
        { icon:"🔗", title:"AND / OR / NOT", body:"Combine multiple conditions: AND = both must be true. OR = at least one must be true. NOT = flip the condition (exclude matches).", color:T.orange },
        { icon:"🃏", title:"IN, LIKE, BETWEEN, IS NULL", body:"IN checks a list. LIKE uses wildcards (% = any characters). BETWEEN checks a range. IS NULL checks for missing values.", color:T.purple },
      ],
      visual:{ type:"filter", caption:"How WHERE filters a table", before:[["C001","NY","Premium"],["C002","CA","Basic"],["C003","NY","Basic"],["C004","TX","Premium"]], condition:"WHERE state = 'NY'", after:[["C001","NY","Premium"],["C003","NY","Basic"]] },
      annotated:[
        { label:"Simple equality", code:"SELECT * FROM customers_raw\nWHERE state = 'NY';", note:"Only rows where state column equals exactly 'NY'" },
        { label:"AND — both conditions", code:"SELECT * FROM customers_raw\nWHERE state = 'CA'\n  AND customer_segment = 'Premium';", note:"Both must be true — CA customers who are Premium" },
        { label:"IN — list of values", code:"SELECT * FROM customers_raw\nWHERE state IN ('NY', 'CA', 'TX');", note:"Shorter than writing three OR conditions" },
        { label:"LIKE — pattern match", code:"SELECT * FROM customers_raw\nWHERE email LIKE '%@gmail.com';", note:"% is a wildcard matching any characters before @gmail.com" },
        { label:"IS NULL — missing values", code:"SELECT * FROM customers_raw\nWHERE phone IS NULL;", note:"Never use = NULL. Always use IS NULL for missing values" },
      ],
      mcq:[
        { q:"What does the WHERE clause do?", opts:["Sorts the results","Filters rows based on a condition","Selects which columns to show","Groups rows together"], ans:1, exp:"WHERE filters the rows returned. Only rows where the condition is TRUE appear in the results." },
        { q:"Which operator checks if a value is in a list?", opts:["BETWEEN","LIKE","IN","EXISTS"], ans:2, exp:"IN checks if a value matches any value in a list. WHERE state IN ('NY','CA') is shorter than WHERE state='NY' OR state='CA'." },
        { q:"What does the % wildcard mean in LIKE?", opts:["Exactly one character","Any single digit","Any sequence of characters","End of string"], ans:2, exp:"% matches any sequence of characters (including none). '%gmail.com' matches anything ending in gmail.com." },
        { q:"How do you correctly check for NULL values?", opts:["WHERE phone = NULL","WHERE phone == NULL","WHERE phone IS NULL","WHERE ISNULL(phone)"], ans:2, exp:"You must use IS NULL, not = NULL. NULL is not equal to anything — it means 'unknown', so = NULL never returns true." },
        { q:"A customer is from 'CA' AND segment is 'Premium'. Which WHERE would match them?", opts:["WHERE state='CA' OR segment='Basic'","WHERE state='CA' AND segment='Premium'","WHERE state='TX' AND segment='Premium'","WHERE state IN ('CA') OR segment='Basic'"], ans:1, exp:"AND requires BOTH conditions to be true. State must be CA and segment must be Premium." },
      ]
    },
    { id:"l4", title:"ORDER BY & LIMIT", dur:"8 min",
      concepts:[
        { icon:"📊", title:"ORDER BY — Sort Your Results", body:"ORDER BY sorts your output. ASC = A→Z or 1→100 (default). DESC = Z→A or 100→1. You can sort by multiple columns.", color:T.accent },
        { icon:"✂️", title:"LIMIT — Control Row Count", body:"LIMIT caps how many rows are returned. Essential for big tables — don't fetch 1 million rows when you only need 10!", color:T.green },
        { icon:"📄", title:"OFFSET — Pagination", body:"OFFSET skips a number of rows before starting. LIMIT 10 OFFSET 20 = rows 21–30. This is how websites show page 3 of results.", color:T.purple },
      ],
      visual:{ type:"sort", caption:"ORDER BY income DESC", rows:[["Carol","120000","→ Row 1"],["Alice","95000","→ Row 2"],["Bob","72000","→ Row 3"],["Dave","68000","→ Row 4"]] },
      annotated:[
        { label:"Sort ascending (default)", code:"SELECT * FROM customers_raw\nORDER BY last_name ASC;", note:"ASC is default — A to Z alphabetically" },
        { label:"Sort descending", code:"SELECT * FROM customers_raw\nORDER BY income DESC;", note:"DESC = highest income first" },
        { label:"Sort by multiple columns", code:"SELECT * FROM customers_raw\nORDER BY state ASC, last_name ASC;", note:"Sort by state first, then by name within each state" },
        { label:"Get top N rows", code:"SELECT first_name, income\nFROM customers_raw\nORDER BY income::NUMERIC DESC\nLIMIT 5;", note:"::NUMERIC casts text to number so sorting works correctly" },
        { label:"Pagination", code:"SELECT * FROM customers_raw\nORDER BY customer_id\nLIMIT 10 OFFSET 20;", note:"Skip first 20, return rows 21–30 (page 3 of 10)" },
      ],
      mcq:[
        { q:"What does ORDER BY income DESC do?", opts:["Sorts by income A-Z","Sorts by income lowest to highest","Sorts by income highest to lowest","Removes duplicate incomes"], ans:2, exp:"DESC = descending order. The highest income appears first, lowest last." },
        { q:"What does LIMIT 10 do?", opts:["Filters rows where id < 10","Returns only the first 10 rows","Skips the first 10 rows","Returns rows in groups of 10"], ans:1, exp:"LIMIT restricts the number of rows returned. LIMIT 10 = return maximum 10 rows." },
        { q:"How would you get rows 11-20 (page 2)?", opts:["LIMIT 10 OFFSET 20","LIMIT 20 OFFSET 10","LIMIT 10 OFFSET 10","LIMIT 10 SKIP 10"], ans:2, exp:"OFFSET 10 skips the first 10 rows. LIMIT 10 then returns the next 10. So you get rows 11-20." },
        { q:"What's the default sort direction if you don't specify ASC or DESC?", opts:["DESC (highest first)","Random","ASC (lowest/A first)","No sorting"], ans:2, exp:"ASC is the default. ORDER BY last_name is the same as ORDER BY last_name ASC." },
        { q:"Why use ::NUMERIC when sorting an income column?", opts:["To make the query faster","Because income is stored as TEXT and sorts 100 before 20 without it","To remove NULL values","To remove the currency symbol"], ans:1, exp:"If income is stored as text, '100' sorts before '20' (alphabetically). Casting to ::NUMERIC makes it sort numerically." },
      ]
    },
  ]},
  { lv:2, title:"Intermediate SQL", color:T.accent, icon:"⚡", lessons:[
    { id:"l5", title:"GROUP BY & HAVING", dur:"15 min",
      concepts:[
        { icon:"🗂️", title:"GROUP BY — Aggregate Rows", body:"GROUP BY collapses rows with the same value into one group. Used with aggregate functions: COUNT(), SUM(), AVG(), MIN(), MAX().", color:T.accent },
        { icon:"🧮", title:"Aggregate Functions", body:"COUNT(*) counts rows. SUM(col) adds values. AVG(col) averages. MIN/MAX find extremes. These work ON GROUPS, not individual rows.", color:T.green },
        { icon:"🚪", title:"HAVING — Filter Groups", body:"HAVING filters AFTER grouping (unlike WHERE which filters before). Use HAVING with aggregate conditions like HAVING COUNT(*) > 5.", color:T.orange },
      ],
      visual:{ type:"groupby", caption:"GROUP BY customer_segment — COUNT(*)", groups:[{ name:"Premium", count:3, color:T.purple },{ name:"Basic", count:5, color:T.accent },{ name:"VIP", count:2, color:T.orange }] },
      annotated:[
        { label:"Count rows per group", code:"SELECT state, COUNT(*) AS customer_count\nFROM customers_raw\nGROUP BY state\nORDER BY customer_count DESC;", note:"GROUP BY state creates one row per unique state" },
        { label:"Average per group", code:"SELECT customer_segment,\n       AVG(income::NUMERIC) AS avg_income\nFROM customers_raw\nWHERE income ~ '^[0-9]+$'\nGROUP BY customer_segment;", note:"AVG calculates average income within each segment" },
        { label:"HAVING filters groups", code:"SELECT state, COUNT(*) AS cnt\nFROM customers_raw\nGROUP BY state\nHAVING COUNT(*) > 5;", note:"Only returns states with MORE than 5 customers" },
        { label:"WHERE vs HAVING", code:"-- WHERE filters ROWS (before grouping)\n-- HAVING filters GROUPS (after grouping)\nSELECT state, COUNT(*) AS cnt\nFROM customers_raw\nWHERE is_active = 'Yes'   -- filter rows first\nGROUP BY state\nHAVING COUNT(*) > 3;      -- then filter groups", note:"WHERE comes before GROUP BY; HAVING comes after" },
      ],
      mcq:[
        { q:"What does GROUP BY do?", opts:["Sorts results alphabetically","Collapses rows with the same value into groups","Filters rows by condition","Joins two tables together"], ans:1, exp:"GROUP BY groups rows with the same column value so aggregate functions (COUNT, SUM, AVG) can run on each group." },
        { q:"Which function counts the total number of rows in each group?", opts:["SUM(*)","AVG(*)","COUNT(*)","TOTAL(*)"], ans:2, exp:"COUNT(*) counts all rows including NULLs. COUNT(column) counts non-NULL values only." },
        { q:"What is the key difference between WHERE and HAVING?", opts:["They are identical","WHERE filters before grouping; HAVING filters after grouping","HAVING runs faster than WHERE","WHERE works on groups; HAVING works on rows"], ans:1, exp:"WHERE filters individual rows BEFORE they are grouped. HAVING filters the resulting groups AFTER GROUP BY runs." },
        { q:"You want only segments with more than 10 customers. Which is correct?", opts:["WHERE COUNT(*) > 10","HAVING customer_count > 10","HAVING COUNT(*) > 10","FILTER COUNT(*) > 10"], ans:2, exp:"HAVING COUNT(*) > 10 filters groups after aggregation. You must use the aggregate function directly in HAVING." },
        { q:"What does AVG(income::NUMERIC) calculate?", opts:["The highest income","The most common income","The sum of all incomes","The average (mean) income across the group"], ans:3, exp:"AVG() calculates the arithmetic mean — sum of all values divided by count. ::NUMERIC converts text to number first." },
      ]
    },
    { id:"l6", title:"JOINs", dur:"20 min",
      concepts:[
        { icon:"🔗", title:"INNER JOIN — Only Matching Rows", body:"INNER JOIN returns rows that exist in BOTH tables. If a customer has no orders, they are excluded. Think Venn diagram intersection.", color:T.accent },
        { icon:"⬅️", title:"LEFT JOIN — Keep All Left Rows", body:"LEFT JOIN keeps ALL rows from the left table, filling NULL for any right-table columns where there's no match. Most common join type.", color:T.green },
        { icon:"🔄", title:"Other JOINs", body:"RIGHT JOIN = keep all right rows. FULL OUTER JOIN = keep all rows from both tables. CROSS JOIN = every row combined with every other row.", color:T.purple },
      ],
      visual:{ type:"join", caption:"INNER JOIN vs LEFT JOIN", inner:"Only customers WITH orders", left:"All customers (orders show NULL if none)" },
      annotated:[
        { label:"INNER JOIN — intersection", code:"SELECT c.first_name, o.order_id, o.amount\nFROM customers_raw c\nINNER JOIN orders o\n  ON c.customer_id = o.customer_id;", note:"Only customers who have at least one order appear" },
        { label:"LEFT JOIN — keep all customers", code:"SELECT c.first_name, o.order_id\nFROM customers_raw c\nLEFT JOIN orders o\n  ON c.customer_id = o.customer_id;", note:"All customers shown; order_id is NULL if no orders" },
        { label:"Find customers with NO orders", code:"SELECT c.first_name\nFROM customers_raw c\nLEFT JOIN orders o\n  ON c.customer_id = o.customer_id\nWHERE o.order_id IS NULL;", note:"Checking IS NULL on right-side column after LEFT JOIN finds non-matches" },
        { label:"Join 3 tables", code:"SELECT c.first_name, o.order_id, p.product_name\nFROM customers_raw c\nJOIN orders o ON c.customer_id = o.customer_id\nJOIN products p ON o.product_id = p.product_id;", note:"Chain multiple JOINs — always join on matching keys" },
      ],
      mcq:[
        { q:"INNER JOIN returns:", opts:["All rows from both tables","Only rows that match in BOTH tables","All rows from the left table","Only unmatched rows"], ans:1, exp:"INNER JOIN is the intersection — rows must exist in both tables to appear in results." },
        { q:"A customer has no orders. With LEFT JOIN (customers left, orders right), what happens?", opts:["That customer is excluded","That customer appears with NULL for order columns","An error is thrown","The customer appears twice"], ans:1, exp:"LEFT JOIN keeps ALL rows from the left table. If there's no match on the right, those columns show NULL." },
        { q:"How do you find customers who have NEVER placed an order using LEFT JOIN?", opts:["INNER JOIN + WHERE order_id > 0","LEFT JOIN + WHERE order_id IS NULL","LEFT JOIN + WHERE order_id IS NOT NULL","RIGHT JOIN + WHERE customer_id IS NULL"], ans:1, exp:"LEFT JOIN all customers, then filter WHERE the right-side key IS NULL. Those NULLs mean no match was found." },
        { q:"What does ON specify in a JOIN?", opts:["Which table to select from","The condition linking the two tables","The columns to display","The sort order"], ans:1, exp:"ON defines the relationship between tables — which columns to match. Usually the primary key and foreign key." },
        { q:"Which JOIN keeps ALL rows from BOTH tables?", opts:["INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL OUTER JOIN"], ans:3, exp:"FULL OUTER JOIN returns all rows from both tables. Unmatched rows get NULLs for the other table's columns." },
      ]
    },
    { id:"l7", title:"Subqueries", dur:"15 min",
      concepts:[
        { icon:"📦", title:"A Query Inside a Query", body:"A subquery is a SELECT statement nested inside another query. The inner query runs first, and its result is used by the outer query.", color:T.purple },
        { icon:"📍", title:"Subquery in WHERE", body:"Use a subquery to compare against a calculated value. E.g. 'find customers who earn more than the AVERAGE income' — you need the average first!", color:T.accent },
        { icon:"🏗️", title:"Subquery in FROM (Derived Table)", body:"Put a subquery in the FROM clause to create a temporary table. Alias it with a name and treat it like any other table.", color:T.green },
      ],
      visual:{ type:"subquery", caption:"How a subquery executes", steps:["1. Inner query runs first: SELECT AVG(income) → returns 82500","2. Outer query uses that result: WHERE income > 82500","3. Only high earners are returned"] },
      annotated:[
        { label:"Subquery in WHERE", code:"SELECT first_name, income\nFROM customers_raw\nWHERE income::NUMERIC > (\n  SELECT AVG(income::NUMERIC)\n  FROM customers_raw\n  WHERE income ~ '^[0-9]+$'\n);", note:"The inner AVG() runs first, then the outer query uses that number" },
        { label:"Subquery in FROM", code:"SELECT segment, avg_income\nFROM (\n  SELECT customer_segment AS segment,\n         AVG(income::NUMERIC) AS avg_income\n  FROM customers_raw\n  WHERE income ~ '^[0-9]+$'\n  GROUP BY customer_segment\n) AS segment_stats\nWHERE avg_income > 80000;", note:"The inner query becomes a temporary named table 'segment_stats'" },
        { label:"Subquery with IN", code:"SELECT first_name, state\nFROM customers_raw\nWHERE customer_id IN (\n  SELECT customer_id\n  FROM orders\n  WHERE order_total > 500\n);", note:"IN with subquery: find customers whose IDs appear in the orders list" },
      ],
      mcq:[
        { q:"In a subquery, which query runs FIRST?", opts:["The outer query","The inner (nested) query","They run simultaneously","It depends on the database"], ans:1, exp:"The inner query always runs first. Its result is then passed to the outer query to use." },
        { q:"What is a 'derived table'?", opts:["A table created by CREATE TABLE","A subquery used in the FROM clause","A temporary index","A view with no data"], ans:1, exp:"A derived table is a subquery in the FROM clause. It acts as a temporary table for the outer query." },
        { q:"When would you use a subquery with WHERE?", opts:["When you need to sort results","When you need to filter based on a calculated/aggregate value","When you need to join tables","When you need to create aliases"], ans:1, exp:"Subqueries in WHERE let you filter against a value you compute on-the-fly, like the average or maximum of a column." },
        { q:"SELECT * FROM customers WHERE id IN (SELECT id FROM vip_list). What does this return?", opts:["All customers","Only customers whose IDs are in vip_list","Only customers NOT in vip_list","Customers with duplicate IDs"], ans:1, exp:"IN with a subquery returns rows from the outer table where the column matches any value in the subquery's result." },
        { q:"A subquery in FROM must have:", opts:["A WHERE clause","At least 2 columns","An alias (name)","A GROUP BY"], ans:2, exp:"Derived tables (subqueries in FROM) must be given an alias using AS. Without a name, the outer query can't reference them." },
      ]
    },
  ]},
  { lv:3, title:"Advanced SQL", color:T.purple, icon:"🚀", lessons:[
    { id:"l8", title:"Window Functions", dur:"25 min",
      concepts:[
        { icon:"🪟", title:"Window Functions — Aggregate Without Collapsing", body:"Unlike GROUP BY, window functions calculate across rows without collapsing them. Each row keeps its identity AND gets a calculated value.", color:T.purple },
        { icon:"🏅", title:"ROW_NUMBER, RANK, DENSE_RANK", body:"ROW_NUMBER: unique sequential number. RANK: ties get same rank, then skip. DENSE_RANK: ties get same rank, NO skip. Example: scores 100,100,90 → RANK: 1,1,3 | DENSE_RANK: 1,1,2", color:T.accent },
        { icon:"📐", title:"PARTITION BY — Rank Within Groups", body:"PARTITION BY is like GROUP BY for window functions. It resets the calculation for each group. E.g. rank customers within each segment separately.", color:T.green },
      ],
      visual:{ type:"rank", caption:"RANK vs DENSE_RANK with ties", rows:[["Alice","100","RANK: 1","DENSE_RANK: 1"],["Bob","100","RANK: 1","DENSE_RANK: 1"],["Carol","90","RANK: 3 ← skip","DENSE_RANK: 2 ← no skip"],["Dave","85","RANK: 4","DENSE_RANK: 3"]] },
      annotated:[
        { label:"ROW_NUMBER — unique sequential", code:"SELECT first_name,\n  ROW_NUMBER() OVER (ORDER BY income::NUMERIC DESC) AS row_num\nFROM customers_raw\nWHERE income ~ '^[0-9]+$';", note:"OVER() defines the window — here sorted by income high to low" },
        { label:"RANK with ties", code:"SELECT first_name, income,\n  RANK() OVER (ORDER BY income::NUMERIC DESC) AS rnk\nFROM customers_raw\nWHERE income ~ '^[0-9]+$';", note:"Tied values share a rank; the next rank skips (1,1,3 not 1,1,2)" },
        { label:"PARTITION BY — rank per group", code:"SELECT first_name, customer_segment, income,\n  RANK() OVER (\n    PARTITION BY customer_segment\n    ORDER BY income::NUMERIC DESC\n  ) AS rank_in_segment\nFROM customers_raw\nWHERE income ~ '^[0-9]+$';", note:"Rankings reset to 1 for each segment — like mini-leaderboards" },
        { label:"Running total (cumulative sum)", code:"SELECT first_name, income,\n  SUM(income::NUMERIC) OVER (\n    ORDER BY customer_id\n  ) AS running_total\nFROM customers_raw\nWHERE income ~ '^[0-9]+$';", note:"SUM with ORDER BY inside OVER creates a running/cumulative total" },
      ],
      mcq:[
        { q:"What makes window functions different from GROUP BY?", opts:["They are faster","They don't collapse rows — each row keeps its own data","They only work on numeric columns","They require a subquery"], ans:1, exp:"Window functions calculate across rows but keep all rows. GROUP BY collapses many rows into one per group." },
        { q:"Scores: 100, 100, 90. What are the DENSE_RANK values?", opts:["1, 2, 3","1, 1, 3","1, 1, 2","2, 2, 3"], ans:2, exp:"DENSE_RANK gives ties the same rank and does NOT skip numbers. 100,100 both get rank 1, then 90 gets rank 2." },
        { q:"What does PARTITION BY do inside a window function?", opts:["Filters rows like WHERE","Sorts the final result","Resets the calculation for each group","Joins multiple tables"], ans:2, exp:"PARTITION BY divides rows into groups and resets the window function for each group — like ranking within categories." },
        { q:"Which function assigns a strictly unique number to every row (no ties)?", opts:["RANK()","DENSE_RANK()","ROW_NUMBER()","COUNT()"], ans:2, exp:"ROW_NUMBER() always assigns a unique number even to ties. Two rows with the same value get different row numbers." },
        { q:"SUM(income) OVER (ORDER BY id) creates a:", opts:["Total sum of all incomes","Running (cumulative) total","Average income per row","Count of income values"], ans:1, exp:"When you add ORDER BY inside OVER(), SUM becomes cumulative — each row adds to all previous rows' total." },
      ]
    },
    { id:"l9", title:"CTEs (Common Table Expressions)", dur:"20 min",
      concepts:[
        { icon:"📝", title:"CTE — Named Temporary Queries", body:"A CTE uses WITH to give a subquery a name. Write it once at the top, reference it multiple times below. Makes complex queries readable.", color:T.purple },
        { icon:"🔗", title:"Multiple CTEs", body:"Chain multiple CTEs separated by commas. Each CTE can reference the ones defined before it. Breaks a complex query into clear logical steps.", color:T.accent },
        { icon:"🔄", title:"CTE vs Subquery", body:"CTEs and subqueries achieve the same thing, but CTEs are reusable and more readable. Use CTEs when you need the same result more than once.", color:T.green },
      ],
      visual:{ type:"steps", caption:"CTE execution flow", steps:["WITH cleaned AS (→ step 1: clean the data)","WITH ranked AS (→ step 2: rank the cleaned data)","SELECT → step 3: query the ranked results"] },
      annotated:[
        { label:"Basic CTE", code:"WITH high_earners AS (\n  SELECT *\n  FROM customers_raw\n  WHERE income::NUMERIC > 80000\n    AND income ~ '^[0-9]+$'\n)\nSELECT first_name, income\nFROM high_earners\nORDER BY income DESC;", note:"WITH gives the subquery a name. Then query it like a normal table below" },
        { label:"Multiple CTEs chained", code:"WITH\ncleaned AS (\n  SELECT *, LOWER(TRIM(email)) AS clean_email\n  FROM customers_raw\n  WHERE email LIKE '%@%'\n),\nranked AS (\n  SELECT *,\n    ROW_NUMBER() OVER(\n      PARTITION BY clean_email\n      ORDER BY customer_id\n    ) AS rn\n  FROM cleaned\n)\nSELECT * FROM ranked WHERE rn = 1;", note:"'ranked' CTE uses 'cleaned' CTE — they chain together cleanly" },
        { label:"CTE for deduplication", code:"WITH deduped AS (\n  SELECT *,\n    ROW_NUMBER() OVER(\n      PARTITION BY customer_id\n      ORDER BY ctid\n    ) AS rn\n  FROM customers_raw\n)\nDELETE FROM customers_raw\nWHERE ctid IN (\n  SELECT ctid FROM deduped WHERE rn > 1\n);", note:"Classic pattern: CTE to identify duplicates, then DELETE them" },
      ],
      mcq:[
        { q:"What keyword starts a CTE?", opts:["DEFINE","TEMP","WITH","AS TABLE"], ans:2, exp:"CTEs always start with WITH. Example: WITH my_cte AS (SELECT ...) SELECT * FROM my_cte;" },
        { q:"When is a CTE executed?", opts:["When it is defined","When it is referenced in the main query","Once at database startup","Only if it contains a WHERE clause"], ans:1, exp:"A CTE is evaluated when the main query runs and references it. It's not stored permanently." },
        { q:"What is the main advantage of CTEs over subqueries?", opts:["They are always faster","They use less memory","They are reusable and more readable","They work on more data types"], ans:2, exp:"CTEs improve readability by naming complex subqueries. They can also be referenced multiple times in the same query." },
        { q:"How do you write TWO CTEs?", opts:["WITH cte1 AS (...) WITH cte2 AS (...)","WITH cte1 AS (...), cte2 AS (...)","WITH (cte1 AS (...), cte2 AS (...))","DEFINE cte1, cte2 AS (...)"], ans:1, exp:"Multiple CTEs are separated by commas after the first WITH. Only one WITH keyword is used." },
        { q:"In a deduplication CTE using ROW_NUMBER(), you DELETE rows WHERE rn > 1. What does this keep?", opts:["Only the last occurrence","Only duplicates","Only rn = 1 (the first occurrence of each group)","All rows"], ans:2, exp:"rn = 1 is the first row in each group. By deleting rn > 1, you keep only the first occurrence and remove all duplicates." },
      ]
    },
  ]},
  { lv:4, title:"Data Cleaning", color:T.orange, icon:"🧹", lessons:[
    { id:"l10", title:"Handling NULLs", dur:"15 min",
      concepts:[
        { icon:"❓", title:"What is NULL?", body:"NULL means UNKNOWN or MISSING — not zero, not empty string. NULL ≠ NULL. Any comparison with NULL returns NULL (not true/false). Always use IS NULL.", color:T.orange },
        { icon:"🛟", title:"COALESCE — First Non-NULL", body:"COALESCE(a, b, c) returns the first non-NULL value. Perfect for providing defaults: COALESCE(phone, 'Not Provided') replaces NULLs with a fallback.", color:T.green },
        { icon:"🔄", title:"NULLIF — Turn Values Into NULL", body:"NULLIF(a, b) returns NULL if a equals b, otherwise returns a. Useful for treating empty strings as NULL: NULLIF(TRIM(col), '')", color:T.accent },
      ],
      visual:{ type:"null", caption:"COALESCE in action", rows:[["Alice","555-1234","→ 555-1234 (uses phone)"],["Bob","NULL","→ 'Not Provided' (fallback)"],["Carol","NULL","→ 'Not Provided' (fallback)"]] },
      annotated:[
        { label:"Find NULL values", code:"SELECT COUNT(*) AS total,\n       COUNT(phone) AS has_phone,\n       COUNT(*) - COUNT(phone) AS null_phones\nFROM customers_raw;", note:"COUNT(*) includes NULLs; COUNT(column) excludes NULLs — the difference = NULLs" },
        { label:"COALESCE — provide defaults", code:"SELECT first_name,\n  COALESCE(phone, 'Not Provided') AS phone,\n  COALESCE(notes, 'No notes')    AS notes\nFROM customers_raw;", note:"First non-NULL value wins. Great for display and reporting" },
        { label:"NULLIF — empty string to NULL", code:"SELECT NULLIF(TRIM(notes), '') AS clean_notes\nFROM customers_raw;", note:"TRIM first removes spaces, then NULLIF converts '' to NULL" },
        { label:"Replace NULL with average", code:"UPDATE customers_raw\nSET income = (\n  SELECT AVG(income::NUMERIC)::TEXT\n  FROM customers_raw\n  WHERE income ~ '^[0-9]+$'\n)\nWHERE income IS NULL;", note:"A common data cleaning technique — impute NULLs with the column average" },
      ],
      mcq:[
        { q:"What does NULL represent in SQL?", opts:["The number zero","An empty string","An unknown or missing value","False"], ans:2, exp:"NULL means the value is unknown or missing — not zero, not empty string. It's a special state that means 'no data'." },
        { q:"Which is the CORRECT way to check for NULL?", opts:["WHERE col = NULL","WHERE col == NULL","WHERE col IS NULL","WHERE ISNULL(col) = 1"], ans:2, exp:"Always use IS NULL. The = operator can't compare with NULL because NULL = anything is always NULL (not true)." },
        { q:"COALESCE(phone, email, 'Unknown') — what does this return if phone IS NULL but email is 'test@x.com'?", opts:["NULL","Unknown","test@x.com","phone"], ans:2, exp:"COALESCE returns the first non-NULL value. phone is NULL, so it moves to email which has a value — 'test@x.com'." },
        { q:"NULLIF(TRIM(notes), '') — what happens when notes is '   ' (spaces only)?", opts:["Returns '   '","Returns NULL","Returns empty string","Throws an error"], ans:1, exp:"TRIM('   ') = ''. Then NULLIF('', '') = NULL. So blank/whitespace notes become NULL." },
        { q:"COUNT(*) returns 100, COUNT(phone) returns 75. How many NULL phones are there?", opts:["75","25","175","100"], ans:1, exp:"COUNT(*) = all rows including NULLs (100). COUNT(phone) = only non-NULL phones (75). 100 - 75 = 25 NULL phones." },
      ]
    },
    { id:"l11", title:"String Cleaning", dur:"18 min",
      concepts:[
        { icon:"✂️", title:"TRIM — Remove Extra Spaces", body:"TRIM removes leading and trailing spaces. LTRIM removes only left spaces. RTRIM removes only right spaces. Always TRIM before comparing strings!", color:T.orange },
        { icon:"🔤", title:"Case Functions", body:"UPPER('hello') → 'HELLO'. LOWER('HELLO') → 'hello'. INITCAP('john doe') → 'John Doe'. Use for standardizing text before storage.", color:T.green },
        { icon:"🔧", title:"REGEXP_REPLACE — Pattern Cleaning", body:"Regular expressions clean complex patterns. REGEXP_REPLACE(phone,'[^0-9]','','g') removes everything that isn't a digit — perfect for phone numbers.", color:T.purple },
      ],
      visual:{ type:"before_after", caption:"String cleaning transformations", rows:[["'  alice  '","TRIM","'alice'"],["'JOHN'","LOWER","'john'"],["'john doe'","INITCAP","'John Doe'"],["'(555) 123-4567'","REGEXP digits only","'5551234567'"]] },
      annotated:[
        { label:"TRIM + case standardization", code:"SELECT\n  TRIM(first_name)     AS clean_name,\n  LOWER(TRIM(email))   AS clean_email,\n  UPPER(TRIM(state))   AS clean_state,\n  INITCAP(TRIM(city))  AS clean_city\nFROM customers_raw;", note:"Chain TRIM with case functions for complete standardization" },
        { label:"Clean phone numbers", code:"SELECT phone,\n  REGEXP_REPLACE(phone, '[^0-9]', '', 'g') AS digits_only\nFROM customers_raw\nWHERE phone IS NOT NULL;", note:"'g' flag = replace ALL matches, not just the first one" },
        { label:"Extract email domain", code:"SELECT email,\n  SUBSTRING(email\n    FROM POSITION('@' IN email) + 1\n  ) AS domain\nFROM customers_raw\nWHERE email LIKE '%@%';", note:"POSITION finds the @ character, SUBSTRING extracts everything after it" },
        { label:"UPDATE to clean data in place", code:"UPDATE customers_raw SET\n  first_name = INITCAP(TRIM(first_name)),\n  last_name  = INITCAP(TRIM(last_name)),\n  email      = LOWER(TRIM(email)),\n  state      = UPPER(TRIM(state))\nWHERE first_name IS NOT NULL;", note:"Always use a transaction when running UPDATE on production data!" },
      ],
      mcq:[
        { q:"TRIM('  hello  ') returns:", opts:["'  hello  '","'hello'","'hello  '","'  hello'"], ans:1, exp:"TRIM removes spaces from both the start AND end of a string. It does not remove spaces in the middle." },
        { q:"Which function converts 'john doe' to 'John Doe'?", opts:["UPPER","LOWER","TRIM","INITCAP"], ans:3, exp:"INITCAP capitalizes the first letter of each word. Perfect for proper-casing names." },
        { q:"REGEXP_REPLACE(phone, '[^0-9]', '', 'g') does what?", opts:["Keeps only digits, removes everything else","Removes only digits","Replaces digits with spaces","Validates the phone format"], ans:0, exp:"[^0-9] is a pattern meaning 'anything that is NOT a digit'. Replacing these with '' (empty) leaves only digits." },
        { q:"Why should you TRIM before LOWER when cleaning email?", opts:["TRIM doesn't work after LOWER","Leading/trailing spaces would remain in the cleaned email","LOWER is faster than TRIM","The order doesn't matter"], ans:1, exp:"Always TRIM first to remove spaces, THEN apply LOWER. Otherwise '  TEST@EMAIL.COM  ' would become '  test@email.com  ' with spaces still there." },
        { q:"Which operator extracts part of a string in PostgreSQL?", opts:["SLICE","MID","SUBSTRING","EXTRACT"], ans:2, exp:"SUBSTRING (or SUBSTR) extracts a portion of a string. You specify the starting position and optionally the length." },
      ]
    },
  ]},
  { lv:5, title:"Interview Prep", color:T.red, icon:"🎯", lessons:[
    { id:"l12", title:"Top SQL Patterns", dur:"30 min",
      concepts:[
        { icon:"🏆", title:"Pattern 1: Find Duplicates", body:"GROUP BY + HAVING COUNT(*) > 1 finds duplicates. Use ROW_NUMBER() OVER(PARTITION BY ... ORDER BY ...) to identify AND keep/delete specific duplicates.", color:T.red },
        { icon:"🥈", title:"Pattern 2: Nth Highest Value", body:"Use DENSE_RANK() in a subquery or CTE. Partition if you need 'Nth highest per group'. This is asked at almost every SQL interview.", color:T.orange },
        { icon:"📈", title:"Pattern 3: Running Totals & Percentages", body:"SUM(col) OVER(ORDER BY ...) = cumulative sum. ROUND(COUNT(*)*100.0 / SUM(COUNT(*)) OVER(), 1) calculates % of total per group.", color:T.purple },
      ],
      visual:{ type:"pattern", caption:"Most asked SQL interview patterns", patterns:[{ name:"Find Nth highest salary",freq:"Very High" },{ name:"Detect duplicates",freq:"Very High" },{ name:"Running/cumulative sum",freq:"High" },{ name:"% of total per group",freq:"High" },{ name:"Self-join for comparisons",freq:"Medium" }] },
      annotated:[
        { label:"Pattern: Nth highest value", code:"-- 2nd highest income in each segment\nSELECT *\nFROM (\n  SELECT first_name, customer_segment, income,\n    DENSE_RANK() OVER(\n      PARTITION BY customer_segment\n      ORDER BY income::NUMERIC DESC\n    ) AS dr\n  FROM customers_raw\n  WHERE income ~ '^[0-9]+$'\n) ranked\nWHERE dr = 2;", note:"Change WHERE dr = 2 to dr = N for any Nth highest value" },
        { label:"Pattern: Running total", code:"SELECT first_name,\n  income::NUMERIC AS income,\n  SUM(income::NUMERIC) OVER(\n    ORDER BY customer_id\n  ) AS cumulative_income\nFROM customers_raw\nWHERE income ~ '^[0-9]+$';", note:"Each row shows income PLUS all previous rows' income" },
        { label:"Pattern: % of total per group", code:"SELECT customer_segment,\n  COUNT(*) AS count,\n  ROUND(\n    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()\n  , 1) AS percentage\nFROM customers_raw\nGROUP BY customer_segment\nORDER BY percentage DESC;", note:"SUM(COUNT(*)) OVER() = grand total across all groups" },
      ],
      mcq:[
        { q:"To find the 3rd highest salary, you use DENSE_RANK() and filter:", opts:["WHERE rank = 3","WHERE dr >= 3","WHERE dr = 3","HAVING rank = 3"], ans:2, exp:"Wrap the DENSE_RANK in a CTE or subquery, then filter WHERE dr = 3 to get the 3rd highest." },
        { q:"SUM(amount) OVER(ORDER BY date) creates:", opts:["Total sum of all amounts","Average amount per date","A running cumulative sum","The maximum amount per date"], ans:2, exp:"SUM with ORDER BY inside OVER() is cumulative — each row adds to all previous rows' total." },
        { q:"To get % of total: you need COUNT(*) * 100.0 / ___", opts:["COUNT(*)","MAX(COUNT(*))","SUM(COUNT(*)) OVER()","AVG(COUNT(*))"], ans:2, exp:"SUM(COUNT(*)) OVER() calculates the grand total across all groups without collapsing them. Dividing gives the percentage." },
        { q:"Which pattern detects duplicate customer_ids?", opts:["SELECT customer_id FROM t WHERE customer_id > 1","SELECT customer_id, COUNT(*) FROM t GROUP BY customer_id HAVING COUNT(*) > 1","SELECT DISTINCT customer_id FROM t","SELECT customer_id FROM t ORDER BY customer_id"], ans:1, exp:"GROUP BY + HAVING COUNT(*) > 1 is the classic pattern for finding duplicates." },
        { q:"In a deduplication query, ROW_NUMBER() assigns rn=1 to the first row per group. To KEEP only the first, you:", opts:["DELETE WHERE rn = 1","SELECT WHERE rn > 1","SELECT WHERE rn = 1","DELETE WHERE rn = 0"], ans:2, exp:"rn=1 is the row you want to KEEP. Deleting WHERE rn > 1 removes all duplicates." },
      ]
    },
    { id:"l13", title:"Query Optimization", dur:"20 min",
      concepts:[
        { icon:"⚡", title:"Why Optimization Matters", body:"A slow query can take 30 seconds instead of 0.1 seconds on large tables. Optimization techniques can improve speed by 100x or more.", color:T.red },
        { icon:"📇", title:"Indexes — Speed Up Lookups", body:"An index is like a book's index page — it lets SQL find data instantly without scanning every row. Create indexes on columns used in WHERE, JOIN, and ORDER BY.", color:T.orange },
        { icon:"🔬", title:"EXPLAIN ANALYZE — Profile Your Query", body:"EXPLAIN ANALYZE shows HOW SQL executes your query and how long each step takes. Use it to find bottlenecks and verify indexes are being used.", color:T.green },
      ],
      visual:{ type:"compare", caption:"With index vs Without index", left:{ label:"No index — Sequential Scan", cols:["Scan ALL 1,000,000 rows","Time: 2.3 seconds"] }, right:{ label:"With index — Index Scan", cols:["Jump directly to matches","Time: 0.002 seconds"] } },
      annotated:[
        { label:"Create indexes on key columns", code:"-- Index on frequently filtered columns\nCREATE INDEX idx_email ON customers_raw(email);\nCREATE INDEX idx_state ON customers_raw(state);\n\n-- Composite index for multi-column WHERE\nCREATE INDEX idx_segment_state\n  ON customers_raw(customer_segment, state);", note:"Index on JOIN keys and WHERE columns for maximum benefit" },
        { label:"Avoid SELECT * in production", code:"-- SLOW: fetches all columns\nSELECT * FROM customers_raw WHERE state = 'NY';\n\n-- FAST: only fetch what you need\nSELECT customer_id, first_name, email\nFROM customers_raw\nWHERE state = 'NY';", note:"SELECT * is expensive on wide tables with many columns" },
        { label:"EXPLAIN ANALYZE — profile query", code:"EXPLAIN ANALYZE\nSELECT first_name, email\nFROM customers_raw\nWHERE state = 'NY';\n\n-- Look for: Seq Scan (slow) vs Index Scan (fast)\n-- Look for: actual time= in each node", note:"Run this before and after adding indexes to see the improvement" },
        { label:"EXISTS vs IN for large sets", code:"-- Slower for large subqueries:\nWHERE customer_id IN (SELECT customer_id FROM orders)\n\n-- Faster: stops at first match\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.customer_id = c.customer_id\n);", note:"EXISTS stops scanning once it finds one match; IN evaluates all rows" },
      ],
      mcq:[
        { q:"What does a database index do?", opts:["Automatically corrects data errors","Speeds up data lookup by avoiding full table scans","Removes duplicate rows","Encrypts sensitive columns"], ans:1, exp:"An index is a separate data structure that lets SQL find rows directly instead of scanning every row — like a book's index." },
        { q:"Which columns should you typically index?", opts:["All columns","Only primary keys","Columns used in WHERE, JOIN ON, and ORDER BY","Only text columns"], ans:2, exp:"Index columns that are frequently filtered (WHERE), joined (ON), or sorted (ORDER BY) for maximum performance benefit." },
        { q:"EXPLAIN ANALYZE shows 'Seq Scan' — what does this mean?", opts:["The query uses an index","The query scans every row in the table (slow)","The query ran successfully","The query result is sequential"], ans:1, exp:"Seq Scan = Sequential Scan = reading every row. On large tables this is slow. You want 'Index Scan' instead." },
        { q:"Why is SELECT * slower than SELECT specific columns?", opts:["SQL can't parse * correctly","It fetches unnecessary data, increasing I/O and memory usage","* requires a separate index","* doesn't work with WHERE clauses"], ans:1, exp:"SELECT * fetches ALL columns including ones you don't need, wasting network bandwidth, memory, and I/O." },
        { q:"EXISTS vs IN — why is EXISTS often faster for large subqueries?", opts:["EXISTS uses an index automatically","EXISTS stops scanning once it finds one match; IN evaluates all matches","EXISTS is newer syntax","They perform identically"], ans:1, exp:"EXISTS short-circuits — it stops as soon as it finds one matching row. IN must evaluate all values before comparing." },
      ]
    },
  ]},
];

// ─── MCQ QUIZ ─────────────────────────────────────────────────────────────────
function McqQuiz({ questions, lessonColor, onPass, onFail }) {
  const [qIdx,     setQIdx]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score,    setScore]    = useState(0);
  const [finished, setFinished] = useState(false);
  const [history,  setHistory]  = useState([]);
  const q = questions[qIdx];

  const choose = (i) => {
    if (answered) return;
    setSelected(i); setAnswered(true);
    const correct = i === q.ans;
    if (correct) setScore(s => s + 1);
    setHistory(h => [...h, { q:q.q, chosen:i, ans:q.ans, correct }]);
  };

  const next = () => {
    if (qIdx + 1 >= questions.length) { setFinished(true); }
    else { setQIdx(i => i+1); setSelected(null); setAnswered(false); }
  };

  if (finished) {
    const pct = Math.round(score / questions.length * 100);
    const passed = pct >= 60;
    return (
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:16 }}>{pct===100?"🏆":pct>=80?"🎉":pct>=60?"✅":"😓"}</div>
        <h3 style={{ color:T.text, margin:"0 0 8px", fontSize:22, fontWeight:800 }}>
          {pct===100?"Perfect Score!":pct>=80?"Great Job!":pct>=60?"Quiz Passed!":"Keep Practicing"}
        </h3>
        <div style={{ color:T.dim, marginBottom:28, fontSize:15 }}>
          You scored <strong style={{ color:passed?T.green:T.orange, fontSize:22 }}>{score}/{questions.length}</strong> ({pct}%)
        </div>
        <div style={{ background:T.muted, borderRadius:99, height:12, marginBottom:28, maxWidth:300, margin:"0 auto 28px" }}>
          <div style={{ height:"100%", borderRadius:99, transition:"width 1s ease",
            width:`${pct}%`, background:pct>=80?T.green:pct>=60?T.orange:T.red }} />
        </div>
        <div style={{ textAlign:"left", marginBottom:28 }}>
          {history.map((h, i) => (
            <div key={i} style={{ padding:"10px 14px", marginBottom:8, borderRadius:8,
              background:h.correct?T.green+"10":T.red+"10",
              border:`1px solid ${h.correct?T.green:T.red}30`, display:"flex", gap:10 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{h.correct?"✅":"❌"}</span>
              <div style={{ fontSize:13, color:T.dim2, lineHeight:1.5 }}>
                <strong style={{ color:T.text }}>{questions[i].q}</strong>
                {!h.correct && <div style={{ color:T.orange, marginTop:4, fontSize:12 }}>Correct: {questions[i].opts[questions[i].ans]}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          {passed
            ? <Btn onClick={() => onPass(pct)} color={T.green}>🎓 Complete Lesson (+{pct===100?100:70} XP)</Btn>
            : <Btn onClick={onFail} color={T.orange}>🔄 Retry Quiz</Btn>
          }
        </div>
        {!passed && <div style={{ color:T.dim, fontSize:12, marginTop:12 }}>Need 60% to pass ({Math.ceil(questions.length*0.6)}/{questions.length} correct)</div>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <span style={{ color:T.dim, fontSize:12, fontWeight:700 }}>Question {qIdx+1} of {questions.length}</span>
        <span style={{ color:lessonColor, fontWeight:800 }}>Score: {score}/{qIdx+(answered?1:0)}</span>
      </div>
      <div style={{ height:5, borderRadius:99, background:T.muted, marginBottom:24 }}>
        <div style={{ height:"100%", borderRadius:99, background:lessonColor,
          width:`${(qIdx/questions.length)*100}%`, transition:"width .4s" }} />
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border2}`, borderRadius:12, padding:"20px 24px", marginBottom:20 }}>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:12 }}>QUESTION {qIdx+1}</div>
        <div style={{ color:T.text, fontSize:17, fontWeight:700, lineHeight:1.5 }}>{q.q}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
        {q.opts.map((opt, i) => {
          let bg=T.card, border=T.border2, color=T.text;
          if (answered) {
            if (i===q.ans) { bg=T.green+"18"; border=T.green; color=T.green; }
            else if (i===selected&&i!==q.ans) { bg=T.red+"18"; border=T.red; color=T.red; }
          } else if (selected===i) { bg=lessonColor+"18"; border=lessonColor; }
          return (
            <button key={i} onClick={()=>choose(i)} disabled={answered}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                background:bg, border:`1.5px solid ${border}`, borderRadius:10,
                color, fontSize:14, cursor:answered?"default":"pointer", textAlign:"left",
                fontWeight:answered&&i===q.ans?700:500, transition:"all .2s", width:"100%" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0,
                background:answered&&i===q.ans?T.green:answered&&i===selected&&i!==q.ans?T.red:T.muted,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:800,
                color:answered&&(i===q.ans||i===selected)?"#fff":T.dim }}>
                {answered&&i===q.ans?"✓":answered&&i===selected&&i!==q.ans?"✗":String.fromCharCode(65+i)}
              </div>
              <span style={{ lineHeight:1.4 }}>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div style={{ background:selected===q.ans?T.green+"12":T.red+"12",
          border:`1px solid ${selected===q.ans?T.green:T.red}30`, borderRadius:10,
          padding:"14px 18px", marginBottom:20 }}>
          <div style={{ fontWeight:800, color:selected===q.ans?T.green:T.red, marginBottom:6, fontSize:14 }}>
            {selected===q.ans?"✅ Correct!":"❌ Not quite"}
          </div>
          <div style={{ color:T.dim2, fontSize:13, lineHeight:1.7 }}>{q.exp}</div>
        </div>
      )}
      {answered && (
        <Btn onClick={next} color={lessonColor}>
          {qIdx+1>=questions.length?"📊 See Results":"Next Question →"}
        </Btn>
      )}
    </div>
  );
}

// ─── LESSON VIEW ──────────────────────────────────────────────────────────────
function LessonView({ lesson, levelColor, isDone, onComplete, onBack }) {
  const [tab,     setTab]     = useState("learn");
  const [quizKey, setQuizKey] = useState(0);
  const TABS = [
    { id:"learn",    icon:"📖", label:"Learn" },
    { id:"examples", icon:"💻", label:"Code Examples" },
    { id:"quiz",     icon:"🧠", label:"Quiz" },
  ];

  const renderVisual = (vis) => {
    if (!vis) return null;
    if (vis.type==="table") return (
      <div style={{ background:"#05080f", borderRadius:12, padding:"20px 24px", border:`1px solid ${T.border2}` }}>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:14 }}>{vis.caption.toUpperCase()}</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{vis.headers.map(h=><th key={h} style={{ padding:"8px 14px", textAlign:"left", borderBottom:`1px solid ${T.border2}`, color:levelColor, fontWeight:700, fontSize:12 }}>{h}</th>)}</tr></thead>
            <tbody>{vis.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j} style={{ padding:"8px 14px", borderBottom:`1px solid ${T.border}`, color:T.dim2, fontSize:13 }}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    );
    if (vis.type==="compare") return (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {[vis.left,vis.right].map((side,i)=>(
          <div key={i} style={{ background:"#05080f", borderRadius:10, padding:"16px 20px", border:`1px solid ${i===0?T.red+"50":T.green+"50"}` }}>
            <div style={{ color:i===0?T.red:T.green, fontSize:11, fontWeight:700, marginBottom:12 }}>{side.label}</div>
            {side.cols.map((c,j)=><div key={j} style={{ color:T.dim2, fontSize:13, marginBottom:6, padding:"4px 8px", background:T.card, borderRadius:6 }}>{c}</div>)}
          </div>
        ))}
      </div>
    );
    if (vis.type==="filter") return (
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:20, alignItems:"center" }}>
        <div>
          <div style={{ color:T.dim, fontSize:11, fontWeight:700, marginBottom:8 }}>BEFORE (all rows)</div>
          {vis.before.map((r,i)=><div key={i} style={{ display:"flex", gap:8, marginBottom:4 }}>
            {r.map((cell,j)=><span key={j} style={{ padding:"3px 8px", background:T.card, borderRadius:5, color:T.dim2, fontSize:12 }}>{cell}</span>)}</div>)}
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ color:T.orange, fontWeight:800, fontSize:13, padding:"8px 12px", background:T.orange+"15", borderRadius:8, whiteSpace:"nowrap" }}>{vis.condition}</div>
          <div style={{ fontSize:20, marginTop:8 }}>→</div>
        </div>
        <div>
          <div style={{ color:T.green, fontSize:11, fontWeight:700, marginBottom:8 }}>AFTER (filtered)</div>
          {vis.after.map((r,i)=><div key={i} style={{ display:"flex", gap:8, marginBottom:4 }}>
            {r.map((cell,j)=><span key={j} style={{ padding:"3px 8px", background:T.green+"15", border:`1px solid ${T.green}30`, borderRadius:5, color:T.green, fontSize:12 }}>{cell}</span>)}</div>)}
        </div>
      </div>
    );
    if (vis.type==="sort") return (
      <div>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, marginBottom:12 }}>{vis.caption.toUpperCase()}</div>
        {vis.rows.map((r,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8, padding:"10px 16px", background:T.card, borderRadius:8, border:`1px solid ${T.border}` }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:levelColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#000", fontWeight:800, fontSize:13, flexShrink:0 }}>{i+1}</div>
            <span style={{ color:T.text, fontWeight:600 }}>{r[0]}</span>
            <span style={{ color:levelColor, marginLeft:"auto", fontWeight:700 }}>${r[1]}</span>
            <span style={{ color:T.dim, fontSize:12 }}>{r[2]}</span>
          </div>
        ))}
      </div>
    );
    if (vis.type==="rank") return (
      <div>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, marginBottom:12 }}>{vis.caption.toUpperCase()}</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Name","Score","RANK","DENSE_RANK"].map(h=><th key={h} style={{ padding:"8px 14px", borderBottom:`1px solid ${T.border2}`, color:levelColor, fontWeight:700, textAlign:"left" }}>{h}</th>)}</tr></thead>
            <tbody>{vis.rows.map((r,i)=><tr key={i}>{r.map((cell,j)=><td key={j} style={{ padding:"8px 14px", borderBottom:`1px solid ${T.border}`, color:j>=2?(cell.includes("skip")?T.red:T.dim2):T.text, fontWeight:j>=2?700:400 }}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    );
    if (vis.type==="groupby") return (
      <div>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, marginBottom:14 }}>{vis.caption.toUpperCase()}</div>
        <div style={{ display:"flex", gap:16, alignItems:"flex-end" }}>
          {vis.groups.map((g,i)=>(
            <div key={i} style={{ flex:1, textAlign:"center" }}>
              <div style={{ color:g.color, fontWeight:800, fontSize:18, marginBottom:6 }}>{g.count}</div>
              <div style={{ height:g.count*24, background:g.color+"30", border:`1px solid ${g.color}`, borderRadius:"6px 6px 0 0" }} />
              <div style={{ background:T.card, padding:"6px 10px", fontSize:12, color:T.dim2, borderRadius:"0 0 6px 6px", border:`1px solid ${T.border}` }}>{g.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
    if (vis.type==="join") return (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {[{label:"INNER JOIN",desc:vis.inner,icon:"🔗",color:T.accent},{label:"LEFT JOIN",desc:vis.left,icon:"⬅️",color:T.green}].map((j,i)=>(
          <div key={i} style={{ background:"#05080f", borderRadius:10, padding:"20px", border:`1px solid ${j.color}40` }}>
            <div style={{ fontSize:22, marginBottom:10 }}>{j.icon}</div>
            <div style={{ color:j.color, fontWeight:800, fontSize:15, marginBottom:8 }}>{j.label}</div>
            <div style={{ color:T.dim2, fontSize:13, lineHeight:1.6 }}>{j.desc}</div>
          </div>
        ))}
      </div>
    );
    if (vis.type==="subquery"||vis.type==="steps") return (
      <div>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, marginBottom:14 }}>{vis.caption.toUpperCase()}</div>
        {vis.steps.map((s,i)=>(
          <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:12 }}>
            <div style={{ width:vis.type==="subquery"?28:8, height:vis.type==="subquery"?28:8, borderRadius:"50%", background:levelColor, flexShrink:0, marginTop:vis.type==="steps"?6:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#000", fontWeight:800, fontSize:13 }}>{vis.type==="subquery"?i+1:""}</div>
            <div style={{ padding:"10px 14px", background:T.card, borderRadius:8, border:`1px solid ${T.border}`, color:T.dim2, fontSize:13, lineHeight:1.5, flex:1 }}>{s}</div>
          </div>
        ))}
      </div>
    );
    if (vis.type==="null") return (
      <div>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, marginBottom:14 }}>{vis.caption.toUpperCase()}</div>
        {vis.rows.map((r,i)=>(
          <div key={i} style={{ display:"flex", gap:12, alignItems:"center", marginBottom:8, fontSize:13 }}>
            <span style={{ color:T.text, minWidth:70 }}>{r[0]}</span>
            <span style={{ color:T.dim, minWidth:50 }}>phone: {r[1]}</span>
            <span style={{ color:T.dim }}>→</span>
            <span style={{ color:r[1]==="NULL"?T.orange:T.green, fontWeight:700, padding:"3px 10px", background:(r[1]==="NULL"?T.orange:T.green)+"15", borderRadius:6 }}>{r[2]}</span>
          </div>
        ))}
      </div>
    );
    if (vis.type==="before_after") return (
      <div>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, marginBottom:12 }}>{vis.caption.toUpperCase()}</div>
        {vis.rows.map((r,i)=>(
          <div key={i} style={{ display:"flex", gap:12, alignItems:"center", marginBottom:8 }}>
            <code style={{ color:T.red, background:T.red+"10", padding:"4px 10px", borderRadius:6, fontSize:12, fontFamily:"monospace", minWidth:160 }}>{r[0]}</code>
            <span style={{ color:levelColor, fontWeight:700, padding:"3px 10px", background:levelColor+"15", borderRadius:6, fontSize:11, whiteSpace:"nowrap" }}>{r[1]}</span>
            <span style={{ color:T.dim }}>→</span>
            <code style={{ color:T.green, background:T.green+"10", padding:"4px 10px", borderRadius:6, fontSize:12, fontFamily:"monospace" }}>{r[2]}</code>
          </div>
        ))}
      </div>
    );
    if (vis.type==="pattern") return (
      <div>
        <div style={{ color:T.dim, fontSize:11, fontWeight:700, marginBottom:14 }}>{vis.caption.toUpperCase()}</div>
        {vis.patterns.map((p,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, marginBottom:8 }}>
            <span style={{ color:T.text, fontSize:14 }}>{p.name}</span>
            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:p.freq==="Very High"?T.red+"20":p.freq==="High"?T.orange+"20":T.green+"20", color:p.freq==="Very High"?T.red:p.freq==="High"?T.orange:T.green }}>{p.freq}</span>
          </div>
        ))}
      </div>
    );
    return null;
  };

  return (
    <div style={{ maxWidth:860 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.accent, cursor:"pointer", fontSize:14, fontWeight:600, marginBottom:20, display:"flex", alignItems:"center", gap:6, padding:0 }}>
        ← Back to Curriculum
      </button>
      <div style={{ padding:"22px 28px", borderRadius:14, marginBottom:24, background:`linear-gradient(135deg,${levelColor}18,${levelColor}08)`, border:`1px solid ${levelColor}35` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ color:levelColor, fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:6 }}>LESSON</div>
            <h2 style={{ margin:0, color:T.text, fontSize:22, fontWeight:900 }}>{lesson.title}</h2>
            <div style={{ color:T.dim, fontSize:13, marginTop:6 }}>⏱ {lesson.dur} · {lesson.mcq.length} quiz questions</div>
          </div>
          {isDone && <Pill label="✓ Completed" color={T.green} />}
        </div>
        <div style={{ display:"flex", gap:4, marginTop:20 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:"8px 18px", borderRadius:20, cursor:"pointer", fontWeight:600, fontSize:13,
                background:tab===t.id?levelColor:T.card, color:tab===t.id?"#000":T.dim,
                border:`1px solid ${tab===t.id?levelColor:T.border}`, transition:"all .15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab==="learn" && (
        <div>
          <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:28 }}>
            {lesson.concepts.map((c,i)=>(
              <div key={i} style={{ display:"flex", gap:18, padding:"20px 24px", background:T.card, border:`1px solid ${c.color}30`, borderRadius:12, borderLeft:`4px solid ${c.color}` }}>
                <div style={{ fontSize:28, flexShrink:0, lineHeight:1 }}>{c.icon}</div>
                <div>
                  <div style={{ color:c.color, fontWeight:800, fontSize:15, marginBottom:6 }}>{c.title}</div>
                  <div style={{ color:T.dim2, fontSize:14, lineHeight:1.7 }}>{c.body}</div>
                </div>
              </div>
            ))}
          </div>
          {lesson.visual && (
            <div style={{ background:T.surface, border:`1px solid ${T.border2}`, borderRadius:14, padding:"24px 28px", marginBottom:24 }}>
              <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:16 }}>📊 VISUAL EXAMPLE</div>
              {renderVisual(lesson.visual)}
            </div>
          )}
          <Btn onClick={()=>setTab("examples")} color={levelColor}>💻 See Code Examples →</Btn>
        </div>
      )}

      {tab==="examples" && (
        <div>
          <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:24 }}>
            {lesson.annotated.map((ex,i)=>(
              <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:24, height:24, borderRadius:6, background:levelColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#000", fontWeight:900, fontSize:11, flexShrink:0 }}>{i+1}</div>
                  <span style={{ color:T.text, fontWeight:700, fontSize:14 }}>{ex.label}</span>
                </div>
                <div style={{ background:"#030609", padding:"20px 24px" }}>
                  <pre style={{ margin:0, color:"#7dd3fc", fontSize:13, lineHeight:1.9, fontFamily:"'Fira Code','Courier New',monospace", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{ex.code}</pre>
                </div>
                <div style={{ padding:"12px 20px", background:levelColor+"0a", borderTop:`1px solid ${levelColor}20`, display:"flex", gap:8 }}>
                  <span style={{ color:levelColor, flexShrink:0 }}>💡</span>
                  <span style={{ color:T.dim2, fontSize:13, lineHeight:1.5 }}>{ex.note}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <Btn onClick={()=>setTab("learn")} outline color={T.dim}>← Back to Learn</Btn>
            <Btn onClick={()=>setTab("quiz")} color={levelColor}>🧠 Take the Quiz →</Btn>
          </div>
        </div>
      )}

      {tab==="quiz" && (
        <div style={{ background:T.surface, border:`1px solid ${T.border2}`, borderRadius:14, padding:"28px 32px" }}>
          <div style={{ marginBottom:24 }}>
            <h3 style={{ margin:"0 0 6px", color:T.text, fontWeight:800, fontSize:18 }}>🧠 Knowledge Check — {lesson.title}</h3>
            <div style={{ color:T.dim, fontSize:13 }}>Answer {lesson.mcq.length} questions · Need 60% to complete the lesson · Instant feedback</div>
          </div>
          <McqQuiz key={quizKey} questions={lesson.mcq} lessonColor={levelColor}
            onPass={(pct) => onComplete(pct)} onFail={() => setQuizKey(k => k+1)} />
        </div>
      )}
    </div>
  );
}

// ─── CURRICULUM VIEW ──────────────────────────────────────────────────────────
export default function CurriculumView({ progress, setProgress }) {
  const [activeLevel, setActiveLevel] = useState(0);
  const [openLesson,  setOpenLesson]  = useState(null);

  const mark = (id, xp=80) => setProgress(p => {
    const d = new Set(p.doneLessons);
    if (d.has(id)) return p;
    return { ...p, doneLessons:new Set([...d, id]), xp:p.xp+xp };
  });

  if (openLesson) {
    const lv = CURRICULUM.find(l => l.lessons.some(ls => ls.id === openLesson.id));
    return (
      <LessonView lesson={openLesson} levelColor={lv?.color||T.accent}
        isDone={progress.doneLessons.has(openLesson.id)}
        onComplete={(pct) => { mark(openLesson.id, pct===100?100:70); setOpenLesson(null); }}
        onBack={() => setOpenLesson(null)} />
    );
  }

  const lv = CURRICULUM[activeLevel];
  const totalLessons = CURRICULUM.reduce((a,l) => a+l.lessons.length, 0);
  const doneLessons  = CURRICULUM.reduce((a,l) => a+l.lessons.filter(ls=>progress.doneLessons.has(ls.id)).length, 0);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h2 style={{ margin:"0 0 6px", color:T.text, fontSize:22, fontWeight:800 }}>📘 SQL Curriculum</h2>
          <p style={{ margin:0, color:T.dim, fontSize:14 }}>Interactive lessons with theory, examples & MCQ quizzes</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:T.text, fontWeight:800, fontSize:18 }}>{doneLessons}/{totalLessons}</div>
          <div style={{ color:T.dim, fontSize:12 }}>lessons completed</div>
          <div style={{ width:120, height:6, borderRadius:99, background:T.muted, marginTop:6 }}>
            <div style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${T.purple},${T.accent})`,
              width:`${doneLessons/totalLessons*100}%`, transition:"width .5s" }} />
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:28, flexWrap:"wrap" }}>
        {CURRICULUM.map((l,i) => {
          const done = l.lessons.filter(ls=>progress.doneLessons.has(ls.id)).length;
          const active = activeLevel===i;
          return (
            <button key={i} onClick={()=>setActiveLevel(i)} style={{ padding:"10px 20px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13,
              background:active?l.color:T.card, color:active?"#000":T.dim, border:`2px solid ${active?l.color:T.border}`,
              transition:"all .15s", position:"relative" }}>
              {l.icon} Level {l.lv}
              {done===l.lessons.length&&done>0&&(
                <span style={{ position:"absolute", top:-6, right:-6, width:18, height:18, background:T.green, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#000", fontWeight:800 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding:"20px 24px", borderRadius:14, marginBottom:24, background:lv.color+"12", border:`1px solid ${lv.color}35` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:lv.color, marginBottom:4 }}>{lv.icon} Level {lv.lv}: {lv.title}</div>
            <div style={{ color:T.dim, fontSize:13 }}>{lv.lessons.length} lessons · {lv.lessons.filter(l=>progress.doneLessons.has(l.id)).length} completed · Each lesson: theory + examples + MCQ</div>
          </div>
          <div style={{ width:80, height:80 }}>
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke={T.muted} strokeWidth="7"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke={lv.color} strokeWidth="7"
                strokeDasharray={`${2*Math.PI*34*lv.lessons.filter(l=>progress.doneLessons.has(l.id)).length/lv.lessons.length} 999`}
                strokeLinecap="round" transform="rotate(-90 40 40)"/>
              <text x="40" y="45" textAnchor="middle" fill={lv.color} fontSize="16" fontWeight="900">
                {lv.lessons.filter(l=>progress.doneLessons.has(l.id)).length}/{lv.lessons.length}
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {lv.lessons.map((lesson, i) => {
          const done = progress.doneLessons.has(lesson.id);
          return (
            <div key={lesson.id} onClick={()=>setOpenLesson(lesson)}
              style={{ padding:"20px 24px", background:done?lv.color+"0a":T.card,
                border:`1.5px solid ${done?lv.color+"50":T.border}`, borderRadius:14,
                cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", gap:20 }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=lv.color+"60"; e.currentTarget.style.background=lv.color+"0d"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=done?lv.color+"50":T.border; e.currentTarget.style.background=done?lv.color+"0a":T.card; }}>
              <div style={{ width:48, height:48, borderRadius:"50%", flexShrink:0, background:done?lv.color:T.muted,
                display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:done?18:16, color:done?"#000":T.dim }}>
                {done?"✓":i+1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:T.text, fontWeight:700, fontSize:16, marginBottom:6 }}>{lesson.title}</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <span style={{ color:T.dim, fontSize:12 }}>⏱ {lesson.dur}</span>
                  <span style={{ color:T.dim, fontSize:12 }}>·</span>
                  <span style={{ color:T.dim, fontSize:12 }}>📖 {lesson.concepts.length} concepts</span>
                  <span style={{ color:T.dim, fontSize:12 }}>·</span>
                  <span style={{ color:T.dim, fontSize:12 }}>💻 {lesson.annotated.length} examples</span>
                  <span style={{ color:T.dim, fontSize:12 }}>·</span>
                  <span style={{ color:done?T.green:lv.color, fontSize:12, fontWeight:700 }}>🧠 {lesson.mcq.length} MCQ questions</span>
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                {done ? <Pill label="✓ Completed" color={T.green} /> : <span style={{ color:lv.color, fontSize:13, fontWeight:700 }}>Start →</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
