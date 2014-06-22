# -*- coding:utf-8 -*-

from handlers.Basehandler import Basehandler

#class Login(tornado.web.RequestHandler):
class Problem(Basehandler):
	def get_city_name(self):
		sql = "select id,name from nb_m_location where id like '48%'"
		result=self.oracle.query(sql)
		return result
#		if (result["user_count"] == 0):
#			return False
#		else:
#			return True


	def get_col_count(self, city_id, isp_id, host_id, bg_time, ed_time):
		if (city_id == ""):
			t1 = ' 1 = 1 '
		else:
			t1 = ' city_id = %s ' %(city_id)
		if (isp_id == ""):
			t2 = ' 1 = 1'
		else:
			t2 = ' isp_id = %s ' %(isp_id) 
		t3 = ' host_id = %s ' %(host_id)
		sql='select count(*) as count from nb_m_ddc_log_col where %s and %s and %s and ctime>= to_date(\'%s\',\'yyyy-mm-dd hh24:mi\') and ctime <= to_date(\'%s\',\'yyyy-mm-dd hh24:mi\')' % (t1, t2, t3, bg_time, ed_time)
		print sql
		result = self.oracle.get(sql)
		return result
	
		

	def get_dsp_count(self, city_id, isp_id, host_id, bg_time, ed_time):
		if (city_id == ""):
			t1 = ' 1 = 1 '
		else:
			t1 = ' city_id = %s ' %(city_id)
		if (isp_id == ""):
			t2 = ' 1 = 1'
		else:
			t2 = ' isp_id = %s ' %(isp_id) 
		t3 = ' host_id = %s ' %(host_id)
		sql='select count(*) as count from nb_m_ddc_log_dsp where %s and %s and %s and ctime>= to_date(\'%s\',\'yyyy-mm-dd hh24:mi\') and ctime <= to_date(\'%s\',\'yyyy-mm-dd hh24:mi\')' % (t1, t2, t3, bg_time, ed_time)
		print sql
		result = self.oracle.get(sql)
		return result
