#-*- coding:utf-8 -*-

import tornado.web
from model.Login import Login

class LoginHandler(Login):
	def get(self):
#		self.redirect("/static/html/login.html")
		self.render("login.html")

	def post(self):
		username = self.get_argument("name")
		passwd = self.get_argument("passwd")
		print username + passwd
		if  self.sign(username, passwd):
			nb_user = self.getLogin(username)
			print nb_user["id"]
			print nb_user["name"]

			self.set_secure_cookie("id", str(nb_user["id"])) 
			self.set_secure_cookie("username",  nb_user["name"])
			print "sign ok"
			self.write("1")
		else:
			print "sign fail"
			#self.render("/templates/login.html", msg="error")
			#self.render('login.html')
			self.write("0")


class LogoutHandler(Login):
	def get(self):
		#self.clear_cookie("id")
		self.clear_cookie("username")
        	self.redirect("/")
