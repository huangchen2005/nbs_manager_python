# -*- coding:utf-8 -*-

from handlers.Basehandler import Basehandler

#class Login(tornado.web.RequestHandler):
class Sms(Basehandler):
	def get_all_sms(self):
		sql = "select id,tm_base, phone_number ,flow_content,fare_content from sms"
		result=self.db.query(sql)
		#print result
		return result
#		if (result["user_count"] == 0):
#			return False
#		else:
#			return True

	def add_sms(self,phone_number, fare_content, flow_content):
		sql = 'insert into sms(phone_number,fare_content, flow_content) values ("%s", "%s", "%s")' %(phone_number, fare_content, flow_content)
		print sql
		self.db.execute(sql)
		return True
