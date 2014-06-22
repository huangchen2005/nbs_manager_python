#-*- coding:utf-8 -*-

from handlers.Sms import SmsHandler
from handlers.Sms import TestHandler
from handlers.Sms import InsertSmsHandler
from handlers.Sms import SearchIMEIHandler
from handlers.Login import LoginHandler
from handlers.Login import LogoutHandler
from handlers.Problem import ProblemCheckHandler

urls = [
(r'/', SmsHandler),
(r'/nbs_sms/Sms/insert', InsertSmsHandler),
(r'/nbs_sms/Sms/search_imei', SearchIMEIHandler),
(r'/login', LoginHandler),
(r'/logout', LogoutHandler),
(r'/problem/check', ProblemCheckHandler),
(r'/problem/checkresult', ProblemCheckHandler),
(r'/test', TestHandler),
]


