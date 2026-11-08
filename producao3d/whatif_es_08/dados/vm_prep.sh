#!/bin/bash
# Na G4: baixa os 3 dados em paralelo e instala o que falta. Saida em /content/mar.
set -e; mkdir -p /content/mar/saida /content/mar/ne10; cd /content/mar
pip -q install rasterio geopandas pyogrio scikit-image netCDF4 >/tmp/pip_mar.log 2>&1 &
[ -s GHS_POP_E2025_GLOBE_R2023A_4326_30ss_V1_0.tif ] || (wget -q -O ghs.zip "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GLOBE_R2023A/GHS_POP_E2025_GLOBE_R2023A_4326_30ss/V1-0/GHS_POP_E2025_GLOBE_R2023A_4326_30ss_V1_0.zip" && unzip -oq ghs.zip && echo GHS_OK) &
[ -s etopo30s.nc ] || (wget -q -O etopo30s.nc "https://www.ngdc.noaa.gov/thredds/fileServer/global/ETOPO2022/30s/30s_surface_elev_netcdf/ETOPO_2022_v1_30s_N90W180_surface.nc" && echo ETOPO_OK) &
[ -s ne10/ne_10m_admin_0_countries.shp ] || (wget -q -O ne.zip "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip" && unzip -oq ne.zip -d ne10 && echo NE_OK) &
wait
ls -la /content/mar /content/mar/ne10 | head -30
python -c "import rasterio, geopandas, skimage; print('LIBS_OK', rasterio.__version__)"
