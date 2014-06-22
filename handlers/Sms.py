# -*- coding:utf-8 -*-
import tornado.web
import logging
import time
from handlers.Basehandler import Basehandler
from model.Sms import Sms

class SmsHandler(Sms):
	@tornado.web.authenticated
	def get(self):
		username = self.get_secure_cookie("username")
		all_sms = self.get_all_sms()
		self.render('sms_search.html', username=username, all_sms=all_sms)


class TestHandler(Basehandler):
	def get(self):
		self.write("abcd")


class InsertSmsHandler(Sms):
	def get(self):	
		username = self.get_secure_cookie("username")
		self.render('sms_insert.html', username=username)


	def post(self):
		phone_number = self.get_argument("phone_number")
                fare_content = self.get_argument("fare_content")
		flow_content = self.get_argument("flow_content")
		self.add_sms(phone_number,fare_content,flow_content)


class SearchIMEIHandler(Basehandler):
	def get(self):
		ua = self.get_argument("ua")
		name = ua.split('-')

		if ((name[3] == "cmnet") or (name[3] == "td")):
                        ll_num = "10086"
                        ye_num = "10086"
                        ll_code="cxgll"
                        ye_code="cxye"
                        ll_key="流量"
                        ye_key="余额"
                        ye_num_key=""
                        ll_num_key=""
                elif(name[3] == "cmwap"):
                        ll_num ="10086"
                        ye_num ="10086"
                        ll_code=""
                        ye_code="101"
                        ll_key="流量"
                        ye_key="余额"
                        ye_num_key=""
                        ll_num_key=""
                elif(name[3] == "wcdma"):
                        ll_num = "10010"
                        ye_num = "10010"
                        ll_code="1071"
                        ye_code="102"
                        ll_key="流量"
                        ye_key="余额"
                        ye_num_key=""
                        ll_num_key=""
                elif((name[3] == "cdma2000") or (name[3] == "cdma")):
                        ll_num = "10001"
                        ye_num = "10001"
                        ll_code="cxll"
                        ye_code="102"
                        ll_key="流量"
                        ye_key="余额"
                        ye_num_key=""
                        ll_num_key=""
         	else:
                        ye_num=""
                        ll_code=""
                        ye_code=""
                        ll_key=""
                        ye_key=""
                        ye_num_key=""
                        ll_num_key=""
		str='ye_num=%s;ye_code=%s;ye_key=%s;ye_num_key=%s;ll_num=%s;ll_code=%s;ll_key=%s;ll_num_key=%s;' %(ye_num,ye_code,ye_key,ye_num_key,ll_num,ll_code,ll_key,ll_num_key)
		self.write(str)
