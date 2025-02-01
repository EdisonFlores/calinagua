import pandas as pd
from pyproj import Proj

# Leer archivo CSV
file_path = '/mnt/data/fisicoquimicos.csv'
df = pd.read_csv(file_path)

# Convertir coordenadas UTM a latitud y longitud considerando la zona UTM de cada fila
for i in range(len(df)):
    zona = int(df.loc[i, 'ZONA'])
    p = Proj(proj='utm', zone=zona, ellps='WGS84', south=True)
    lon, lat = p(df.loc[i, 'COORD- X'], df.loc[i, 'COORD- Y'], inverse=True)
    df.loc[i, 'COORD- X'] = lat
    df.loc[i, 'COORD- Y'] = lon

# Renombrar columnas a latitud y longitud
df.rename(columns={'COORD- X': 'latitud', 'COORD- Y': 'longitud'}, inplace=True)

# Guardar el DataFrame actualizado en un nuevo archivo CSV
output_file_path = '/mnt/data/fisicoquimicos_latlong.csv'
df.to_csv(output_file_path, index=False)

output_file_path
