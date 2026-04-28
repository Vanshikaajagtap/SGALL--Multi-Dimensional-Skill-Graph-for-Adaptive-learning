import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "template1"),
    "user": os.getenv("DB_USER", "vanshikajagtap"),
    "password": os.getenv("DB_PASSWORD", ""),
}

_pool: pool.SimpleConnectionPool | None = None


def get_pool() -> pool.SimpleConnectionPool:
    
    global _pool
    if _pool is None or _pool.closed:
        _pool = pool.SimpleConnectionPool(minconn=1, maxconn=10, **DB_CONFIG)
    return _pool


def get_db():
    p = get_pool()
    conn = p.getconn()
    conn.autocommit = False
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        p.putconn(conn)
