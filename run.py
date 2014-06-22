# -*- coding:utf-8 -*-

import tornado.httpserver
import tornado.ioloop
import logging, time, signal
from tornado.options import define, options
from application import Application



define("port", default=8888, help="run on the given port", type=int)


def sig_handler(sig, frame):
	logging.warning('Caught signal: %s', sig)
	tornado.ioloop.IOLoop.instance().add_callback(shutdown)

def shutdown():
	logging.info('Stopping http server')
	http_server.stop()
	
	logging.info('Will Shutdown in %s seconds ...', 10)
	io_loop = tornado.ioloop.IOLoop.instance()
	
	deadline = time.time() + 10

	def stop_loop():
		now = time.time()
		if now < deadline and (io_loop._callbacks or io_loop._timeouts):
			io_loop.add_timeout(now + 1, stop_loop)
		else:
			io_loop.stop()
			logging.info('Shutdown')
	stop_loop()


if __name__ == "__main__":
	tornado.options.parse_command_line()
	http_server = tornado.httpserver.HTTPServer(Application())
	http_server.listen(options.port)
	logging.info('start listen on port: %s', options.port)
	signal.signal(signal.SIGTERM, sig_handler)
	signal.signal(signal.SIGINT, sig_handler)
	tornado.ioloop.IOLoop.instance().start()
