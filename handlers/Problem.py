# -*- coding:utf-8 -*-
import tornado.web
import datetime
from handlers.Basehandler import Basehandler
from model.Problem import Problem


class ProblemCheckHandler(Problem):
	@tornado.web.authenticated
        def get(self):
                username = self.get_secure_cookie("username")
		city_names = self.get_city_name()
                self.render('problem_check.html', username=username, city_names=city_names)

	@tornado.web.authenticated
	def post(self):
                username = self.get_secure_cookie("username")

		city_id	= self.get_argument("city_id")
		isp_id	= self.get_argument("isp_id")
		host_id	= self.get_argument("host_id")
		if (host_id == ""):
			self.write("host_id不能为空")
			return
		elif (not host_id.isdigit()):
			self.write("host_id必须为正整数")
			return
			
		
		time_type = self.get_argument("time_type")
		if (time_type == "relatively"):
			rela = int(self.get_argument("rela"))
			b_time = datetime.datetime.now()
			e_time = b_time + datetime.timedelta(hours=rela)
			bg_time = b_time.strftime('%Y-%m-%d %H:%M')
			ed_time = e_time.strftime('%Y-%m-%d %H:%M')
			print bg_time
			print ed_time

		elif (time_type == "absolutely"):
			bg_time = self.get_argument("bg_time")
			ed_time = self.get_argument("ed_time")
		else:
			self.write("time_type类型不合法")
			return

		col_count = self.get_col_count(city_id, isp_id, host_id, bg_time, ed_time)
		dsp_count = self.get_dsp_count(city_id, isp_id, host_id, bg_time, ed_time)
                self.render('problem_check_result.html', username = username, col_count = col_count, dsp_count = dsp_count)
