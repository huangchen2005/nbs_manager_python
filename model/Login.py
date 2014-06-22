# -*- coding:utf-8 -*-

import hashlib
from handlers.Basehandler import Basehandler

#class Login(tornado.web.RequestHandler):
class Login(Basehandler):
	def sign(self, username, passwd):
		self.username = username
		tmp_passwd = hashlib.sha1(passwd.upper()).hexdigest().upper() + self.username
		self.passwd =  hashlib.md5(tmp_passwd).hexdigest().upper()
		
	#	print tmp_passwd
	#	print self.passwd
		result=self.db.get("SELECT count(*) as user_count FROM nb_m_user WHERE name = %s and password= %s and status = 1", self.username, self.passwd)
		if (result["user_count"] == 0):
			return False
		else:
			return True


	def getLogin(self,username):
		nb_user = self.db.get("select id,name from nb_m_user  WHERE name = %s  and status = 1", username)
		return nb_user
