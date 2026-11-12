import pymysql
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)
load_dotenv()

def db_connection():
    connection = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=5
    )
    return connection

def relato_post(relato):
    connection = None
    try:
        connection = db_connection()
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO relatos (relato) VALUES (%s)", (relato,))
        connection.commit()
        return True
    except pymysql.MySQLError:
        logger.exception("Erro ao inserir relato")
        if connection:
            connection.rollback()
        return False
    finally:
        if connection:
            connection.close()