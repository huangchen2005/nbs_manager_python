# -*- coding:utf-8 -*-

import torndb
import tornado.web
import os
import cx_Oracle
from config import COOKIE_SECRET, DB_HOST, DB_USER, DB_PASSWD, DB_NAME, DEBUG, ORACLE_HOST, ORACLE_USER, ORACLE_PASSWD, ORACLE_SERVICE
from urls import urls
from model.myOracle import myOracle

ORACLE_HOST= "192.168.1.15"
ORACLE_USER = "netben"
ORACLE_PASSWD = "netben010807"
ORACLE_SERVICE = "nbsdb"


class Connection(torndb.Connection):
	def __init__(self):
        	super(Connection, self).__init__(
			host=DB_HOST, database=DB_NAME,
                        user=DB_USER, password=DB_PASSWD)
        	self._db_args["init_command"] = 'SET time_zone = "+8:00"'
        	try:
            		self.reconnect()
        	except Exception:
            		logging.error("Cannot connect to MySQL on %s", self.host,exc_info=True)

class Application(tornado.web.Application):
	def __init__(self):
		handlers = urls		
        	settings = dict(
            		template_path = os.path.join(os.path.dirname(__file__), "templates"),
            		static_path = os.path.join(os.path.dirname(__file__), "static"),
            		xsrf_cookies = False,
			cookie_secret = COOKIE_SECRET,
			login_url = "/login",
			debug = DEBUG,
		)
        	tornado.web.Application.__init__(self, handlers, **settings)
        	self.db = Connection()
	
#		self.oracle = myOracle(host=ORACLE_HOST, service=ORACLE_SERVICE, user=ORACLE_USER, password=ORACLE_PASSWD) 
#	 	sql = "select id,name from nb_m_location where id like '48%"
#                result=self.oracle.query(sql)
#                print result

		#sql="select id,name from nb_m_location where id like '48%'"
		#sql1="select count(*) from nb_m_location"
		#con = myOracle(host="192.168.1.15", service="nbsdb", user="netben", password="netben010807")
		self.oracle= myOracle(host=ORACLE_HOST, service=ORACLE_SERVICE, user=ORACLE_USER, password=ORACLE_PASSWD)
		#aa = con.get(sql1)
		#bb = con.query(sql)
