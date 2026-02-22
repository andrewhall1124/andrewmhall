---
title: "Bear Lake: a file system database for Polars"
date: "2025-01-01"
summary: "I wanted Snowflake for side projects, but couldn't justify the cost. So I built Bear Lake — a Python package that lets you perform database operations on Parquet files using Polars syntax."
---

# Bear Lake: a file system database for Polars
## Why I built Bear Lake
I wanted Snowflake for side projects, but couldn’t justify the cost. Having worked as a data engineering intern, I have become used to the speed of analytical databases like Snowflake. Snowflake is great for enterprise development, but it is practically unavailable for individual use. I’m often working on a lot of data-oriented side projects where an analytical database would be incredibly helpful. The reality, however, is that for side projects, you are limited to tools like SQLite, Postgres, and Supabase.

## My Background
I’ve been writing Python code almost every day for the last 3-4 years, and many of the projects I’ve worked on have involved data analysis with Numpy, Pandas, and Matplotlib. The projects are almost always focused on asset pricing research, where datasets contain approximately 15 million rows of stock market data. To be fair, this is a relatively small dataset, but the many group-by and rolling operations I executed in Pandas with my laptop always felt very slow.

My first data engineering internship was with [Nuqleous](https://nuqleous.com/), a SaaS company. There, I used tools such as Apache Airflow and Snowflake to run large-scale data pipelines for point-of-sale customer data. I got hooked on Snowflake's merge syntax, which enabled idempotent workflows with easy readability, and I came to love the stage-merge workflow common to data pipelines.

My second data engineering internship was with [Double River](https://doubleriver.com/), a startup-sized quant hedge fund. There, I was exposed to Polars. I had heard of Polars on LinkedIn previously, but had never really explored it. When it came to speeding up Pandas, I had looked into drop-in replacements like cuDF Pandas or FireDucks. Polars was a game-changer. For me, the refrain “I came for the speed, but stayed for the syntax” was 100% true. I won’t go into all of the reasons why you should ditch Pandas for Polars, but I think this [article](https://benfeifke.com/posts/the-3-reasons-why-i-switched-from-pandas-to-polars-20230328/) by Ben Feifke sums up the points quite well. In summary, becoming a “Polars power user” has affected many of the ways I view working with data.

## Searching for a self-hosted analytical database.
When I first heard about DuckDB, I thought my problem had been solved. DuckDB promised the analytical speed of Snowflake combined with the portability of SQLite. Indeed, the support for  SQL syntax like MERGE INTO and the ability to create materialized views were big wins for me. Furthermore, DuckDB's performance on analytical benchmarks was impressive, to say the least (see [clickbench](https://benchmark.clickhouse.com/)). The big drawback, though, was that it is an entirely in-process database. This makes it really great for “last mile” analytics, but not ideal for deployed applications.

The next option I explored was ClickHouse. ClickHouse is, quite literally, an open-source alternative to Snowflake. It was everything I needed, and with the template ready to deploy on Railway, I thought I had finally found the solution I was looking for. Then, after running it for a month, I realized it was far too expensive. It was going to cost me about $20/mo on Railway which just felt too expensive for the small side project I was working on. I had a very small amount of data — on the order of gigabytes — and ClickHouse was simply too enterprise-grade for what I needed. 

## Enter Bear Lake
Bear Lake is a Python package that lets you perform database operations on a collection of Parquet files using Polars syntax. I’ve never used data lakes like Apache Iceberg before, but from what I understand, this package functions very much like a cross between SQLite and Apache Iceberg. It checked the boxes for everything I wanted: cheap, clean syntax, and fast. It’s probably easiest to explain Bear Lake by jumping straight into the syntax. Below, I show how to connect to a database, create a table, insert data, and run a query.

```python
import polars as pl
import bear_lake as bl

# Connect to database
db = bl.connect("my_database")

# Create a table with schema and partitioning
schema = {
    "date": pl.Date,
    "ticker": pl.String,
    "price": pl.Float64
}

db.create(
    name="stocks",
    schema=schema,
    partition_keys=["ticker"],
    primary_keys=["date", "ticker"],
    mode="error"
)

# Insert data
data = pl.DataFrame({
    "date": ["2024-01-01", "2024-01-02"],
    "ticker": ["AAPL", "AAPL"],
    "price": [150.0, 152.5]
})

db.insert("stocks", data, mode="append")

# Query data using Polars lazy evaluation
result = db.query(
    bl.table("stocks")
    .filter(pl.col("ticker") == "AAPL")
    .select(["date", "price"])
)

print(result)
```

## How it works
Under the hood, the connect method returns a Python class that implements the logic for executing database-like operations on a Parquet blob. The “database” itself is just a folder, where each “table” is a subfolder containing many Parquet files containing that table's data. The Parquet files are split by the user-specified partition key (which corresponds to a column in the table). 

The create method creates the folder structure, including a metadata.json file containing the table schema, in the root subfolder. The insert method reads any existing data, appends new data, and overwrites the existing file (append, error, and overwrite modes are supported). As you can tell by now, most of the logic is just file system operations, but the real magic is the query functionality. To understand the query function, you first need to understand lazy evaluation in Polars. 

The standard evaluation format in Polars is eager evaluation. This just means that Polars immediately executes exactly what you ask it to, in the order you ask it. Lazy evaluation works in two steps. First, it builds the query, applying query optimizations such as predicate and projection pushdown, and then it collects (executes) it. For more information, check out this excellent documentation page on the Polars [website](https://docs.pola.rs/user-guide/concepts/lazy-api/). 

The query method is really simple. It just executes the query produced by the lazy api. 

```python
def query(self, expression: pl.LazyFrame) -> pl.DataFrame:
    return expression.collect()
```

The key to making this possible is the `bl.table()` abstraction. This abstraction simply returns a Polars LazyFrame by applying a Polars scan over the Parquet file blob. This means you can apply any LazyFrame allowed operation within the query method!

Everything I’ve explained so far is for a local file system environment. Now, there are many reasons not to use Bear Lake in a production environment (no ACID guarantees, no concurrency control, etc.), but to do so, you just need to create an S3-compatible storage bucket and pass the environment variables to Bear Lake. All locally supported operations are also supported by S3. Best of all, since Railway storage buckets don’t charge for egress, this solution is practically free!

## Conclusion
Bear Lake isn't trying to be Snowflake or Iceberg. It's a simple tool for a simple problem: I wanted database-like operations on Parquet files with Polars syntax, without paying for or managing infrastructure I didn't need. For my own research workflows, it's become indispensable. If you're working on small-to-medium data projects and find yourself wishing SQLite understood LazyFrames, give it a try. The project is on [GitHub](https://github.com/andrewhall1124/bear-lake) — issues and contributions are welcome.
