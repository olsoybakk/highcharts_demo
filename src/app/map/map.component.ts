import { Component, OnInit } from '@angular/core';
import { Feature, Geolocation, Map, MapBrowserEvent, MapEvent, Overlay, View } from 'ol';
import RenderFeature from 'ol/render/Feature';
import { GeoJSON as GeoJSONFormat } from 'ol/format';
import { Layer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { ImageWMS, OSM, TileWMS, Vector as VectorSource, WMTS as WmtsSource } from 'ol/source';
import { Extent } from 'ol/extent';
import { Attribution, defaults as defaultControls } from 'ol/control';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { addProjection, Projection } from 'ol/proj';
import { getTopLeft, getWidth } from 'ol/extent';
import { Circle, Geometry, Point } from 'ol/geom';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import * as proj4x from 'proj4';
import { MapService } from './map.service';

const proj4 = (proj4x as any).default;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  mapService: MapService;
  duration = 1000;
  nveSrsCode = 32633;
  map: Map;
  projection: Projection;
  overlayLayers: Array<Layer<any, any>>;
  attribution: Attribution;
  overlay: Overlay;
  geolocation: Geolocation;
  mapEpsgCode = 32633;
  mapEpsgDef = '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
  extent = [-2500000.0, 3500000.0, 3045984.0, 9045984.0];
  initialExtent = [-110000.0, 6415015.0, 1127000.0, 7972400];
  numZoomLevels = 18;

  debug = false;
  clickAll = true;
  showButtons = false;
  touch = false;

  container = document.getElementById('popup');
  content = document.getElementById('popup-content');
  closer = document.getElementById('popup-closer');

  constructor(mapService: MapService) { 
    this.mapService = mapService;
    this.map = new Map({});
    if (proj4.defs(`EPSG:${this.mapEpsgCode}`) === undefined) {
      proj4.defs(`EPSG:${this.mapEpsgCode}`, this.mapEpsgDef);
    }
    this.projection = new Projection({
      code: `EPSG:${this.mapEpsgCode}`,
      extent: this.extent,
      units: 'm'
    });
    addProjection(this.projection);

    this.attribution = new Attribution({
      collapsible: false,
    });
    this.overlay = new Overlay({});
    this.geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true
      },
      projection: 'EPSG:' + this.mapEpsgCode
    });


    // https://geo.ngu.no/mapserver/MarinGrenseWMS2?language=nor&request=GetCapabilities&service=WMS
    //https://nve.geodataonline.no/arcgis/rest/services/Mapservices/MarinGrense/MapServer/export?
    //bbox=269554.0115904634%2C7035088.848363988%2C274247.72931123216%2C7042777.655408269
    //&bboxSR=25833
    //&imageSR=25833
    //&size=887%2C1453
    //&dpi=96
    //&format=png8
    //&transparent=true
    //&layers=show%3A3%2C7%2C8
    //&f=image
    // const nveUrl = 'https://nve.geodataonline.no/arcgis/rest/services/Mapservices/Elspot/MapServer/export?'
    // const properties = {
    //   'dpi': '96',
    //   'transparent': 'true',
    //   'format': 'png32',
    //   'bboxSR': this.nveSrsCode,
    //   'imageSR': this.nveSrsCode,
    //   'size': '256,256',
    //   'f': 'image'
    // };

    // const elspotLayer = new TileLayer({
    //   source: new TileWMS({
    //     attributions: ['ElSpot'],
    //     url: nveUrl,
    //     params: Object.assign({'layers': 'show:0'}, properties)
    //   }),
    //   maxZoom: 11,
    //   visible: true,
    //   zIndex: 2
    // });
    // elspotLayer.set('name', 'ElSpot');

    const parseData = (source: VectorSource<Geometry>, data: any, success: any) => {
      // console.log('data', data);
      if (source === undefined) return;
      const format = source.getFormat();
      if (format === undefined) return;
      const features = format.readFeatures(data);
      features.forEach(f => {
        // console.log('type', typeof(f));
        const feature = f as Feature<Geometry>;
        feature.set('name', this.getElspotAreaName(f.get('ElSpotOmr')));
        // console.log('feature', feature);
        // spotSource.addFeature(feature);
      });
      source.addFeatures(features as Feature<Geometry>[]);
      if (success) success(features as Feature<Geometry>[]);
    }

    const spotSource = new VectorSource({
      
      // extent: this.extent,
      // projection: projection,
      format: new GeoJSONFormat({
        dataProjection: this.projection,
        featureProjection: this.projection,
        geometryName: 'geometry'
      }),
      loader: async (
        extent: number[],
        resolution: number,
        projection: Projection,
        success: ((arg0: Feature<any>[]) => void) | undefined,
        failure: (() => void) | undefined
      ): Promise<void> => {
        const d = localStorage.getItem('elspot_polygon');
        if (d != undefined) {
          parseData(spotSource, JSON.parse(d), success);
        } else {
          this.mapService.getData('assets/elspot.geojson')
          .subscribe(data => {
            localStorage.setItem('elspot_polygon', JSON.stringify(data));
            parseData(spotSource, data, success);
          });
        }
      }
    });

    const styleFunction = (feature: RenderFeature | Feature<Geometry>, resolution: number): Style[] => {
      const fill = new Fill({
        color: `${this.getElspotColorByName(feature.get('ElSpotOmr'))}33`
      });
      const stroke = new Stroke({
        color: `${this.getElspotColorByName(feature.get('ElSpotOmr'))}ff`,
        width: 5
      });
      const text = new Text({
        text: feature.get('name')
      });
      return [new Style({
        fill: fill,
        stroke: stroke,
        text: text
    })];
    }

    const spotLayer = new VectorLayer({
      // name: name,
      opacity: 1,
      // renderMode: 'vector',
      source: spotSource,
      style: styleFunction,
      visible: true,
      zIndex: 2
    });
    spotLayer.set('name', 'ElSpot');

    this.overlayLayers = [
      this.createOpencacheLayer({layer: 'egk', name: 'Europa grunnkart', visible: false}),
      this.createOpencacheLayer({layer: 'norges_grunnkart', name: 'Norges grunnkart', visible: false}),
      this.createOpencacheLayer({layer: 'norges_grunnkart_graatone', name: 'Norges grunnkart gråtone', visible: false}),
      this.createOpencacheLayer({layer: 'topo4', name: 'Topografisk kart', visible: true}),
      // elspotLayer,
      spotLayer,
    ];

  }

  wmtsTileGrid = (numZoomLevels: number, matrixSet: string, projection: Projection, startLevel?: number) => {
    let resolutions = new Array(numZoomLevels);
    let matrixIds = new Array(numZoomLevels);
    
    // console.log('wmtsTileGrid()', numZoomLevels, matrixSet, projection);
    let projectionExtent = projection.getExtent();

    let size = getWidth(projectionExtent) / 256;
    
    startLevel = startLevel ? startLevel : 0;
    for (let z = startLevel; z < (numZoomLevels + startLevel); ++z) {
        resolutions[z] = size / Math.pow(2, z);
        matrixIds[z] = matrixSet + ':' + z;
    }

    let wmtsTileGrid = new WMTSTileGrid({
        origin: getTopLeft(projectionExtent),
        resolutions: resolutions,
        matrixIds: matrixIds
    });

    return wmtsTileGrid;
  }

  createOpencacheLayer = (options: {layer: string, name: string, visible: boolean}) => {
    const tileLayer = new TileLayer({
      // name: 'Norges grunnkart',
      opacity: 1,
      extent: this.extent,
      source: new WmtsSource({
          url: '//opencache.statkart.no/gatekeeper/gk/gk.open_wmts?',
          // layer: 'europa',
          layer: options.layer,
          attributions: 'Kartverket',
          matrixSet: `EPSG:${this.mapEpsgCode}`,
          format: 'image/png',
          projection: this.projection,
          tileGrid: this.wmtsTileGrid(this.numZoomLevels, `EPSG:${this.mapEpsgCode}`, this.projection),
          style: 'default',
          wrapX: true,
          crossOrigin: 'anonymous'
      }),
      visible: options.visible,
      zIndex: 1
    });
    tileLayer.set('name', options.name);

    return tileLayer;
  }

  ngOnInit(): void {

    // console.log('center', proj4(`EPSG:900913`, `EPSG:${this.mapEpsgCode}`, [1009000, 8414000]));

    this.map = new Map({
      controls: defaultControls({attribution: false, zoom: false}).extend([this.attribution]),
      layers: [
        // new TileLayer({
        //   source: new OSM(),
        // })
        new TileLayer({
          // name: 'Europakart',
          opacity: 1,
          extent: this.extent,
          source: new WmtsSource({
              url: '//opencache.statkart.no/gatekeeper/gk/gk.open_wmts?',
              // layer: 'europa',
              layer: 'europa_forenklet',
              attributions: 'Kartverket',
              matrixSet: `EPSG:${this.mapEpsgCode}`,
              format: 'image/png',
              projection: this.projection,
              tileGrid: this.wmtsTileGrid(this.numZoomLevels, `EPSG:${this.mapEpsgCode}`, this.projection),
              style: 'default',
              wrapX: true,
              crossOrigin: 'anonymous'
          }),
          visible: true,
          zIndex: 0
        }),
      ],
      target: 'map',
      view: new View({
        center: [508500.0, 7203123.0],
        zoom: 1,
        projection: `EPSG:${this.mapEpsgCode}`
      }),
    });

    this.overlayLayers.forEach((layer: Layer<any, any>) => {
      this.map.addLayer(layer);
    });

    this.geolocation.on('change', () => {
      // console.log('geolocation', this.geolocation.getAccuracy());
      let position = this.geolocation.getPosition();
      let accuracy = this.geolocation.getAccuracy();
      this.geolocation.setTracking(false);
      if (!position || accuracy === undefined) return;
      const coordinate = proj4(`EPSG:4326`, `EPSG:${this.mapEpsgCode}`, position);
      position[0] = coordinate[0];
      position[1] = coordinate[1];

      let extent: Extent = [
        position[0] - 5*accuracy,
        position[1] - 5*accuracy,
        position[0] + 5*accuracy,
        position[1] + 5*accuracy
      ];

      const geolocationStyle = (f: any) => {
        const feature = f as Feature<Geometry>;
        const circle = feature.getGeometry() as Circle;
        if (circle.getRadius !== undefined) {
          return [
            new Style({
              fill: new Fill({
                color: '#0000FF11',
              }),
              stroke: new Stroke({
                color: '#0000FFAA',
                width: 2
              })
            })
          ];
        }
        return [
          new Style({
            image: new CircleStyle({
              fill: new Fill({
                color: '#0000FFAA'
              }),
              radius: 3
            })
          }),
          new Style({
            image: new CircleStyle({
              fill: new Fill({
                color: '#0000FF77'
              }),
              radius: 5
            })
          })
        ];
      };

      let geolocationSource: VectorSource<Geometry>;
      const geolocationLayers = this.map.getAllLayers().filter(l => l.get('name') === 'geolocation');
      if (geolocationLayers.length === 0) {
        geolocationSource = new VectorSource();
        const geolocationLayer = new VectorLayer({
          source: geolocationSource,
          style: geolocationStyle,
          zIndex: 9
        });
        geolocationLayer.set('name', 'geolocation');
        this.map.addLayer(geolocationLayer);
      } else {
        geolocationSource = geolocationLayers[0].getSource();
        geolocationSource.clear();
      }
      const geolocationPoint = new Feature({
        geometry: new Point(coordinate)
      });
      const geolocationCircle = new Feature({
        geometry: new Circle(coordinate, accuracy ? accuracy : accuracy)
      });
      // geolocationCircle.set('name', `${Math.round(10 * accuracy) / 10} m`);
      geolocationSource.addFeatures([geolocationPoint, geolocationCircle]);

      // console.log(this.geolocation.getPosition(), this.geolocation.getAccuracy());
      const self = this;
      this.map.getView().fit(extent, { duration: this.duration, size: this.map.getSize(), callback: () => {
        self.map.getView().animate({ center: position, duration: self.duration });
        setTimeout(self.focusMap, 10);
      } });
    });

    this.map.on('singleclick', this.clickMap);
    // this.map.on('pointermove', this.pointermove);
    // this.map.on('moveend', (event: MapEvent) => {
    //   const ext = event.map.getView().calculateExtent(event.map.getSize());
    //   console.log('moveend', event.map.getView().getZoom(), event.map.getView().getCenter(), ext);
    // });

    this.container = document.getElementById('popup');
    this.content = document.getElementById('popup-content');
    this.closer = document.getElementById('popup-closer');
  
    this.overlay = new Overlay({
      element: this.container ? this.container : undefined,
      autoPan: true,
      autoPanAnimation: {
        duration: 250,
      },
    });

    if (this.closer) {
      this.closer.onclick = () => { this.closePopup(); };
    }

    this.map.addOverlay(this.overlay);

    const self = this;
    window.addEventListener('resize', (evt: any) => {
      setTimeout(self.checkSize, 100);
    });
    window.addEventListener('orientationchange', (evt: any) => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 900);
      setTimeout(self.checkSize, 1000);
    });
    setTimeout(this.checkSize, 10);
    setTimeout(this.focusMap, 100);
    setTimeout(this.gotoHome, 100);

    this.setTouch();
  }

  gotoHome = () => {
    // let extent: Extent = [430000, 7910000, 3562000, 11555000];
    this.map.getView().fit(this.initialExtent, { duration: this.duration, size: this.map.getSize() });
    this.focusMap();
  }

  closePopup = () => {
    this.overlay.setPosition(undefined);
    if (this.closer) {
      this.closer.blur();
    }
    this.focusMap();
    return false;
  }

  focusMap = () => {
    const element = this.map.getTargetElement();
    if (element) element.focus();
  }

  setTouch = () => {
    const touch = document.getElementsByClassName("ol-touch").length !== 0;
    if (this.touch !== touch) {
      const element = document.getElementById('toggleButton');
      if (element && element.parentElement) {
        element.parentElement.classList.add('mapButtonTouch');
      }
      this.touch = touch;
    }
  }

  checkSize = () => {
    let size = this.map.getSize();
    if (size) {
      size[0] = window.innerWidth;// - 50;
      size[1] = window.innerHeight;// - 50;
      // const element = document.getElementById('map');
      // if (element) {
      //   element.style.width = size[0] + 'px';
      //   element.style.height = size[1] + 'px';
      // }
      const self = this;
      setTimeout(() => {
        // self.map.setSize(size);
        self.map.updateSize();
      }, 10);
      let small = true; //size[0] < 600;
      this.attribution.setCollapsible(small);
      this.attribution.setCollapsed(small);
    }
  }

  getElspotAreaName = (code: string) => {
    switch (code.toUpperCase()) {
      case 'NO 1':
        return 'Oslo';
      case 'NO 2':
        return 'Kr.sand';
      case 'NO 3':
        return 'Tr.heim';
      case 'NO 4':
        return 'Tromsø';
      case 'NO 5':
        return 'Bergen';
      default:
        return code;
      }
  }

  getElspotColorByName = (code: string) => {
    switch (code.toUpperCase()) {
      case 'NO 1':
        return '#7bb4ec';
      case 'NO 2':
        return '#e4d354';
      case 'NO 3':
        return '#f7a35b';
      case 'NO 4':
        return '#f15c80';
      case 'NO 5':
        return '#90ed7d';
      default:
        return "#ff0000";
      }
  }

  pointermove = (evt: MapBrowserEvent<any>) => {
    // console.log('pointermove', evt.coordinate);
    let html = '';
    evt.map.forEachFeatureAtPixel(evt.pixel, (feature, layer, geometry) => {
      html += '<p>';
      // html += '<span style="font-weight: 500;">';
      // html += layer.get('name');
      // html += '</span>'
      // html += '<br/>';
      html += `${feature.get('name')}`;
      html += '</p>';
      // console.log('click', feature, layer, geometry);
      // console.log('click', feature.get('name'));
    });
    if (this.content) {
      if (html.length > 0) {
        // console.log(coordinate);
        this.content.innerHTML = html;
        this.overlay.setPosition(evt.coordinate);
      } else {
        this.closePopup();
      }
    }
  }

  clickMap = (evt: MapBrowserEvent<any>) => {
    // console.log('clik', evt);
    let html = '';
    evt.map.forEachFeatureAtPixel(evt.pixel, (feature, layer, geometry) => {
      if (feature.get('name') !== undefined) {
        html += '<p>';
        // html += '<span style="font-weight: 500;">';
        // html += layer.get('name');
        // html += '</span>'
        // html += '<br/>';
        html += `${feature.get('name')}`;
        html += '</p>';
        // console.log('click', feature, layer, geometry);
        // console.log('click', feature.get('name'));
      }
    });
    if (this.content) {
      if (html.length === 0) {
        html = '<p>Ingen treff</p>';
        setTimeout(this.closePopup, 1000);
      }
      // console.log(coordinate);
      this.content.innerHTML = html;
      this.overlay.setPosition(evt.coordinate);
    }
  }

  // _clickMap = (evt: any) => {
  //   let size = this.map.getSize();
  //   if (!size) return;

  //   let layers = '';
  //   for (let i  = 0; i < this.overlayLayers.length; ++i) {
  //     if (this.clickAll || this.overlayLayers[i].getVisible()) {
  //       layers += layers.length === 0 ? 'visible:' + i : ',' + i;
  //     }
  //   }

  //   if (layers.length === 0) return;

  //   const coordinate = evt.coordinate;
  //   const extent = this.map.getView().calculateExtent();
  //   // console.log('coord', coordinate);

  //   // let url = 'https://nve.geodataonline.no/arcgis/rest/services/SkredKvikkleire2/MapServer/identify';
  //   let url = 'https://nve.geodataonline.no/arcgis/rest/services/Mapservices/Elspot/MapServer/identify'
  //   url += '?f=json';
  //   url += '&maxAllowableOffset=15';
  //   url += '&returnFieldName=true';
  //   // url += '&returnGeometry=true';
  //   url += '&returnGeometry=false';
  //   url += '&returnUnformattedValues=false';
  //   url += '&returnZ=false';
  //   // url += '&tolerance=10';
  //   url += '&tolerance=1';
  //   url += '&imageDisplay=' + size[0] + ',' + size[1], + ',96';
  //   url += '&geometry=' + encodeURIComponent('{"x":' + coordinate[0] + ',"y":' + coordinate[1] + '}');
  //   url += '&geometryType=esriGeometryPoint';
  //   url += '&sr=' + this.nveSrsCode;
  //   url += '&mapExtent=' + extent.join(',');
  //   url += '&layers=' + layers;

  //   fetch(url)
  //     .then((response) => { return response.json(); })
  //     .then((result) => {
  //       let html = '';
  //       if (result && result.results) {
  //         let i = 0;
  //         result.results.forEach((res: any) => {
  //           // console.log(res);
  //           html += '<p>';
  //           html += '<span style="font-weight: 500;">';
  //           html += res.layerName;
  //           html += '</span>'
  //           html += '<br/>';
  //           if (res.layerId === 0){
  //             if (res.displayFieldName) {
  //               // html += `${res.displayFieldName}: ${this.getElspotAreaName(res.attributes[res.displayFieldName])}`;
  //               html += `${this.getElspotAreaName(res.attributes[res.displayFieldName])}`;
  //             }
  //           }
  //           let attrHtml = '';
  //           if (res.attributes) {
  //             attrHtml = '<br/><span style="cursor: pointer;" onclick="show(' + i + ')">...</span>';
  //             attrHtml += '<div id="pre_' + i + '" style="display: none; max-height: 200px; max-width: 300px; overflow: auto;"><pre>';
  //             for(let key in res.attributes) {
  //               attrHtml += key + ': ' + res.attributes[key];
  //               attrHtml += '\n';
  //             }
  //           }
  //           attrHtml += '</pre></div>';
  //           // console.log(
  //           //   res.layerName,
  //           //   res.attributes
  //           // );
  //           html += attrHtml;
  //           html += '</p>';
  //           i++;
  //         });
  //       }
  //       if (this.content) {
  //         if (html.length === 0) {
  //           html = '<p>Ingen treff</p>';
  //           setTimeout(this.closePopup, 1000);
  //         }
  //         // console.log(coordinate);
  //         this.content.innerHTML = html;
  //         this.overlay.setPosition(coordinate);
  //       }
  //     });
  // }

  isValidString = (value: string) => {
    return !(value === undefined || value === 'Null');
  }

  parseNVEDate = (value: string) => {
    if (value === undefined || value === 'Null') return '';
    let date = new Date(value.split(".").reverse().join("."));
    return date.getDate() + '/' + date.getMonth() + '-' + date.getFullYear();
  }

  getUrl = (url: string) => {
    if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
      return url;
    }
    return 'https://' + url;
  }

  geoloc = () => {
    this.geolocation.setTracking(true);
    this.focusMap();
  }

  goto = (name: string) => {
    const view = this.map.getView();
    if (name === 'ask') {
      view.animate({ center: [1228613, 8414112], zoom: 15, duration: this.duration });
      this.toggleButtons();
    }
    this.focusMap();
  }

  toggleLayer = (layer: Layer<any, any>) => {
    layer.setVisible(!layer.getVisible());
    this.focusMap();
  }

  isVisible = (layer: Layer<any, any>) => {
    return layer.getVisible();
  }

  toggleClickAll = () => {
    this.clickAll = !this.clickAll;
    this.focusMap();
  }

  isClickAll = () => {
    return this.clickAll;
  }

  zoom = (zoom: number) => {
    this.map.getView().animate({ zoom: zoom, duration: this.duration / 4 });
    this.focusMap();
  }

  zoomIn = () => {
    let zoom = this.map.getView().getZoom();
    if (zoom !== undefined) this.zoom(++zoom);
  }

  zoomOut = () => {
    let zoom = this.map.getView().getZoom();
    if (zoom !== undefined) this.zoom(--zoom);
  }

  toggleDebug = () => {
    this.debug = !this.debug;
  }

  toggleButtons = () => {
    // console.log('toggle');
    const element = document.getElementById('toggleButton');
    // if (element) {
    //   element.innerHTML = this.showButtons ? '&raquo;' : '&laquo;';
    // }
    this.showButtons = !this.showButtons;
    if (this.touch) {
      setTimeout(() => {
        const divElement = document.getElementsByClassName('mapButtons');
        if (divElement && divElement.length > 0){
          divElement[0].classList.add('mapButtonsTouch');
        }
      }, 10);
    }
    this.focusMap();
  }

  visibleButtons = () => {
    // console.log('visible', this.showButtons);
    return this.showButtons;
  }

  getLayerName = (layer: Layer<any, any>) => {
    return layer.get('name');
  }
}
