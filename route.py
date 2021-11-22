import pymongo
import requests

mongodb = "mongodb://mapsuser:settembre22@cloud.nergal.it:27017/?authSource=maps"
client = pymongo.MongoClient(mongodb)
db = client['maps']
collection_line = db['line']
collection_route = db['route']
collection_pointInterest = db['pointInterest']
centri = db['centri'].find({"attivo":1})
esterni = db['esterni'].find({"attivo":1})
pointInterest = [[14.828158, 40.648442]]
index = 0
index_destination = 0
mode = "driving"

def route(response, index_route, index_destination):
    collection_route.insert_one({"id_route": index_route, "id_destination": index_destination, "mode": mode, "da": [coordPartenza[1], coordPartenza[0]], "a": [coordArrivo[1],coordArrivo[0]], "duration": response["routes"][0]["legs"][0]["duration"]["value"], "distance": response["routes"][0]["legs"][0]["distance"]["value"]})
    path = response
    Line = [{"id_route": index, "path": path}]
    collection_line.insert_many(Line)
    """
    for i in response['routes'][0]['legs'][0]['steps']:
        j = i['geometry']['coordinates']
        if (contatore == 1):  #OSRM non inserisce le coordinate di partenza negli steps
            j.insert(0,[float(coordPartenza[1]), float(coordPartenza[0])])
        duration = i['duration']/(len(j)-1) #calcolo del tempo medio per un tratto della polyline
        for z in range(0,len(j)-1):
            Line.append({"id_route": index, "id_polyline": contatore, "duration": duration, "da": [j[z][0], j[z][1]], "a": [j[z+1][0], j[z+1][1]]})
            contatore += 1
    Line.pop() #elimino l'ultimo elemento che in OSRM ha sempre durata nulla e medesime coordinate di partenza e arrivo
    if Line:
        collection_line.insert_many(Line)
    """
""""
def distance(lng,lat):
    collection = db["centri"]
    myquery = {"loc": {"$near": {"$geometry": {"type": "Point", "coordinates": [lng, lat]}, "$maxDistance": 100}}}
    
    response = []
    for i in collection.find(myquery): #cerco gli esagoni più vicini al punto 
        response.append(i)
        client.close()
    distance = []
    for i in range(0, len(response)):
        lng1 = math.radians(response[i]["loc"]["coordinates"][0])
        lat1 = math.radians(response[i]["loc"]["coordinates"][1])
        deltaLat = lat1 - math.radians(lat)
        deltaLng = lng1 - math.radians(lng)
        a = math.pow(math.sin(deltaLng/2), 2) + math.cos(lng1) * math.cos(math.radians(lng)) * math.pow(math.sin(deltaLat/2), 2)
        c = 2 * math.asin(math.sqrt(a))
        earth_radius = 6371
        distance.append(c * earth_radius * 1000)

    distanceMin = distance[0]
    flag = 0
    for i in range(0, len(distance)):
        if distanceMin > distance[i]:
            distanceMin = distance[i]
            flag = i
    return response[flag]
"""

for punto in pointInterest:
    coordArrivo = [str(punto[1]), str(punto[0])]
    risposte = []
    index_destination += 1
    collection_pointInterest.insert_one({"id_pointInterest": index_destination, "point": coordArrivo})

    for centro in centri:
        index += 1
        print(index)
        coordPartenza = [str(centro['loc']['coordinates'][1]), str(centro['loc']['coordinates'][0])]
        response = requests.get("https://maps.googleapis.com/maps/api/directions/json?origin="+coordPartenza[0]+","+coordPartenza[1]+"&destination="+coordArrivo[0]+","+coordArrivo[1]+"mode="+mode+"&key=")
        response = response.json()
        route(response, index, index_destination)

#requests.get("https://maps.googleapis.com/maps/api/directions/json?origin="+latPartenza+","+lngPartenza+"&destination="+latArrivo+","+lngArrivo+"&traffic_model&departure_time=now&key=YOUR_API_KEY")
#OSRM vuole prima la longitudine e poi la latitudine mentre Google Maps prima la latitudine e poi la longitudine