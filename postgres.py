import psycopg2 as psycopg2
import pymongo
import json
import polyline

mongodb = "mongodb://mapsuser:settembre22@cloud.nergal.it:27017/?authSource=maps"
client = pymongo.MongoClient(mongodb)
db = client['maps']
collection_route = db['route']
collection_line = db['line']
collection_pointInterest = db['pointInterest']

conn = psycopg2.connect("dbname='maps' host='cloud.nergal.it' user='mapsuser' password='settembre22'")
cursor = conn.cursor()

cursor.execute("delete from tratte")
conn.commit()

for i in collection_pointInterest.find():
    destination = i['id_pointInterest']
    route = collection_route.find({'id_destination': destination})
    for j in route:
        indexRoute = j['id_route']
        time = j['duration']
        distance = j['distance']
        mezzo = j['mode']
        line = collection_line.find({'id_route': indexRoute})
        poly = []
        for k in line:
            steps = k["path"]["routes"][0]["legs"][0]["steps"]
            for i in steps:
                poly += polyline.decode(i["polyline"]["points"])
        path = [{"path": poly}]
        path = json.dumps(path)
        cursor.execute("insert into tratte (origin, destination, olat, olng, dlat, dlng, distance, time, path, mode) values "
                       "("+str(indexRoute)+", "+str(destination)+", "+str(j['da'][1])+", "+str(j['da'][0])+", "+str(j['a'][1])+", "+str(j['a'][0])+", "+ str(distance) +", "+ str(time) + ",'"+ path +"','"+ mezzo +"');")
        conn.commit()
conn.close()