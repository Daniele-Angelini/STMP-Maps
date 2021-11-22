import tornado.ioloop
import tornado.web
import psycopg2
import os
import json

dbmaps = "dbname='maps' host='cloud.nergal.it' user='mapsuser' password='settembre22'"
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

class GetPoints(BaseHandler):
    def get(self):
        conn = None
        points = []
        try:
            conn = psycopg2.connect(dbmaps)
            cursor = conn.cursor()
            sql = "select id, lat, lng from points order by id;"
            cursor.execute(sql)
            lines = cursor.fetchall()
            for line in lines:
                points.append({"id": line[0], "lat": line[1], "lng": line[2]})
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
        print("Trovati " + str(len(points)) + " punti")
        result = json.dumps(points)
        self.set_header('Content-Type', 'text/json')
        self.write(result)

class GetPois(BaseHandler):
    def get(self):
        tipo = self.get_argument('type')
        conn = None
        pois = []
        try:
            conn = psycopg2.connect(dbmaps)
            cursor = conn.cursor()
            sql = "select id, lat, lng, name from pois where type=%s order by id;"
            cursor.execute(sql, (tipo,))
            lines = cursor.fetchall()
            for line in lines:
                pois.append({"id": line[0], "lat": line[1], "lng": line[2], "name": line[3]})
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
        print("Trovati " + str(len(pois)) + " poi")
        result = json.dumps(pois)
        self.set_header('Content-Type', 'text/json')
        self.write(result)

class GetAccessibility(BaseHandler):
    def get(self):
        poi = None
        tipo = None
        try:
            poi = self.get_argument('poi')
        except:
            pass
        try:
            tipo = self.get_argument('type')
        except:
            pass
        conn = None
        poly = []
        try:
            mezzo = self.get_argument('mezzo')
            conn = psycopg2.connect(dbmaps)
            cursor = conn.cursor()
            if poi is not None:
                sql = "select origin, destination, points.lat, points.lng, pois.lat, pois.lng, distance, " \
                      "time, path from tratte, points, pois where origin=points.id and destination=pois.id and " \
                      "destination=%s and mode=%s order by origin, time;"
                data = poi
            if tipo is not None:
                sql = "select distinct(origin) origin, destination, points.lat, points.lng, pois.lat, pois.lng, " \
                      "distance, time, path from tratte, points, pois where pois.type=%s and origin=points.id and " \
                      "destination=pois.id and mode=%s order by origin, time;"
                data = tipo
            cursor.execute(sql, (data,mezzo,))
            tratte = cursor.fetchall()
            for line in tratte:
                poly.append({"origin": line[0], "distance": line[6], "time": line[7], "path": line[8],
                             "olat": line[2], "olng": line[3]})
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
        print("Trovate " + str(len(poly)) + " polyline")
        result = json.dumps(poly)
        self.set_header('Content-Type', 'text/json')
        self.write(result)


def make_app():
    return tornado.web.Application([
        (r"/getPoints", GetPoints),
        (r"/getPois", GetPois),
        (r"/getAccessibility", GetAccessibility),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": './static', "default_filename": "index.html"}),
        (r'/js/(.*)', tornado.web.StaticFileHandler, {'path': './static/js'}),
        (r'/css/(.*)', tornado.web.StaticFileHandler, {'path': './static/css'})
    ])


if __name__ == "__main__":
    app = make_app()
    app.listen(60004)
    tornado.ioloop.IOLoop.current().start()