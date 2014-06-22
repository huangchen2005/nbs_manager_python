import myOracle

sql="select id,name from nb_m_location where id like '48%'"
sql1="select count(*) from nb_m_location"
con = myOracle.myOracle(host="192.168.1.15", service="nbsdb", user="netben", password="netben010807")
aa = con.get(sql1)
bb = con.query(sql)
print aa
print bb
