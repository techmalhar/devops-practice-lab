# app/database.py
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    conn = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", "fitness@123"),
        database=os.getenv("MYSQL_DATABASE", "fitness_app")
    )
    return conn
