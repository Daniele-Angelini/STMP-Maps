# Maps
STMP Maps software
Per il momento ho messo solo la parte python server, che ho un po' ristrutturato per:
- renderla stabile senza necessità di riavvio per ogni funzione
- leggere e scrivere su mongodb (sul server remoto vserver.nergal.it)
- poter essere utilizzata sia a livello locale (es. da pycharm) che copiata e lanciata sul server
Quando è avviata da pycharm, si trova già installati i package necessari (tornado, pymongo, ecc.)
