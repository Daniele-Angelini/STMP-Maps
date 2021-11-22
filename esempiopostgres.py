import psycopg2 as psycopg2

conn = psycopg2.connect("dbname='maps' host='cloud.nergal.it' user='mapsuser' password='settembre22'")
cursor = conn.cursor()

""" esempio di insert """
cursor.execute("insert into tratte (origin, destination, olat, olng, dlat, dlng, distance, time, path) values "
               "(10000, 10000, 1.1, 2.2, 3.3, 3.4, 10, 20, 'bla bla');")
print("inseriti " + cursor.statusmessage)
conn.commit() #dopo insert, update e delete bisogna sempre fare un commit

""" esempio di select """
cursor.execute("select origin, destination, time, path from tratte;")
tratte = cursor.fetchall()
for line in tratte:
    print("origine=" + str(line[0]) + ", destinazione=" + str(line[1]) + ", durata=" + str(line[2]) + ", path=" + line[3])

""" esempio di delete """
cursor.execute("delete from tratte where origin=10000 and destination=10000")
print("cancellati " + cursor.statusmessage)
conn.commit() #dopo insert, update e delete bisogna sempre fare un commit

conn.close() #ricordarsi sempre di chiudere la connessione
