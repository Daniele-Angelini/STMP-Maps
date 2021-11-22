import tornado.ioloop
import psycopg2 as psycopg2
import tornado.web
import os
import pymongo
import json


mongodb = "mongodb://mapsuser:settembre22@cloud.nergal.it:27017/?authSource=maps"
root = os.path.dirname(__file__)

"""
Gestione funzioni web con Tornado
"""

class BaseHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        print("setting headers!!!")
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "*")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')

    def options(self):
        # no body
        self.set_status(204)
        self.finish()

class RegistraCentri(BaseHandler):
    def post(self):
        print("RegistraCentri started!")
        data = tornado.escape.json_decode(self.request.body)
        tipo = data['tipo']
        centri = data['dati']
        punti = []
        npunto = 0
        for centro in centri:
            npunto = npunto + 1
            punto = {'punto': npunto,  'attivo': centro['active'], 'loc': {"type": "Point"}}
            punto['loc']['coordinates'] = [centro['lng'], centro['lat']]
            punti.append(punto)
        with pymongo.MongoClient(mongodb) as client:
            db = client.maps
            db[tipo].drop({})
            db[tipo].insert_many(punti)
            db[tipo].create_index([('loc', '2dsphere')])
        registrati = len(centri)
        print("registrati " + str(registrati) + " centri in " + tipo)
        result = {}
        result['result'] = "ok"
        result['number'] = registrati
        self.write(json.dumps(result))


class InviaCentri(BaseHandler):
    print("Pronti per inviare!")
    def get(self):
        tipo = self.get_argument('tipo')
        centri = []
        with pymongo.MongoClient(mongodb) as client:
            db = client.maps
            result = db[tipo].find({})
            for loc in result:
                coordinates = loc['loc']['coordinates']
                centro = {'lat': coordinates[1], 'lng': coordinates[0], 'active': loc['attivo']}
                centri.append(centro)
        print("Trovati " + str(len(centri)) + " centri")
        result = json.dumps(centri)
        self.set_header('Content-Type', 'text/json')
        self.write(result)

class InviaColori(BaseHandler):
    def get(self):
        tipo = self.get_argument('tipo')
        tavolaColori = []
        with pymongo.MongoClient(mongodb) as client:
            db = client.maps
            result = db[tipo].find({})
            for i in result:
                colori = i["color"]
                tempo = i["time"]
                coordinate = {"color": colori,"time": tempo}
                tavolaColori.append(coordinate)
        print("Trovati " + str(len(tavolaColori)) + " colori")
        result = json.dumps(tavolaColori)
        self.set_header('Content-Type', 'text/json')
        self.write(result)

class InviaVelocita(BaseHandler):
    def get(self):
        with pymongo.MongoClient(mongodb) as client:
            db = client.maps
            centriColorati = db['centriColorati'].find({})
            centriVelocita = []
            for i in centriColorati:
                lat = i['lat']
                lng = i['lng']
                tempo = i['time']
                centri = {'lat':lat,'lng':lng,'time':tempo}
                centriVelocita.append(centri)
        print("Trovati " + str(len(centriVelocita)) + " centri")
        result = json.dumps(centriVelocita)
        self.set_header('Content-Type', 'text/json')
        self.write(result)

class InviaPolyline(BaseHandler):
    def get(self):
        conn = psycopg2.connect("dbname='maps' host='cloud.nergal.it' user='mapsuser' password='settembre22'")
        cursor = conn.cursor()
        cursor.execute("select origin, destination, olat, olng, dlat, dlng, distance, time, path from tratte order by origin;")
        conn.commit()
        tratte = cursor.fetchall()
        poly = []
        for line in tratte:
            poly.append({"origin": line[0], "distance": line[6], "time": line[7], "path": line[8], "olat": line[2], "olng": line[3]})
        conn.close()
        print("Trovate " + str(len(poly)) + " polyline")
        result = json.dumps(poly)
        self.set_header('Content-Type', 'text/json')
        self.write(result)

def make_app():
    return tornado.web.Application([
        (r"/registraCentri", RegistraCentri),
        (r"/inviaCentri", InviaCentri),
        (r"/ritiraColori", InviaColori),
        (r"/inviaVelocita", InviaVelocita),
        (r"/inviaPolyline", InviaPolyline),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": './static', "default_filename": "index.html"}),
        (r'/js/(.*)', tornado.web.StaticFileHandler, {'path': './static/js'}),
        (r'/css/(.*)', tornado.web.StaticFileHandler, {'path': './static/css'})
    ])


if __name__ == "__main__":
    app = make_app()
    app.listen(60004)
    tornado.ioloop.IOLoop.current().start()