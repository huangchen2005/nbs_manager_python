# -*- coding:utf-8 -*-

import tornado.web

class Basehandler(tornado.web.RequestHandler):
	@property
	def db(self):
		return self.application.db

	@property
	def oracle(self):
		return self.application.oracle
	
	def get_current_user(self):
		return self.get_secure_cookie("username")
