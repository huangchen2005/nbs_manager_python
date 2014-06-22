# -*- coding:utf-8 -*-

import cx_Oracle
import logging
import itertools

class Row(dict):
    """A dict that allows for object-like property access syntax."""
    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError:
            raise AttributeError(name)


class myOracle(object):
	def __init__(self, host, service, user=None, password=None,):
		self.host = host
		self.service = service
		self.user = user
		self.password = password
	        self._db = None

		try:
			self._db = cx_Oracle.connect(self.user, self.password, self.host +"/"+ self.service)
        	except Exception:
            		logging.error("Cannot connect to Oracle on %s", self.host,exc_info=True)

	def query(self, query, *parameters, **kwparameters):

		cursor = self._db.cursor()
		try:
			self._execute(cursor, query, parameters, kwparameters)
			column_names = [d[0] for d in cursor.description]
            		return [Row(itertools.izip(column_names, row)) for row in cursor]
		finally:
			cursor.close()

	def get(self, query, *parameters, **kwparameters):
        	"""Returns the first row returned for the given query."""
        	rows = self.query(query, *parameters, **kwparameters)
        	if not rows:
        		return None
        	elif len(rows) > 1:
            		raise Exception("Multiple rows returned for Database.get() query")
        	else:
            		return rows[0]
 
	
	def execute(self, query, *parameters, **kwparameters):
        	"""Executes the given query, returning the lastrowid from the query."""
        	cursor = self._db.cursor()
        	try:
			cursor._execute(cursor, query, parameters, kwparameters)
            		return cursor.lastrowid
        	finally:
            		cursor.close()


	def _execute(self, cursor, query, parameters, kwparameters):
        	try:
        		return cursor.execute(query, kwparameters or parameters)
        	except OperationalError:
            		logging.error("Error connecting to MySQL on %s", self.host)
            		self.close()
            	raise

	

	
	def __del__(self):
		self._db.close()
		self._db = None
