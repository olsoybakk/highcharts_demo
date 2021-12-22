import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import Geolocation from 'ol/Geolocation';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import View from 'ol/View';
import { Extent } from 'ol/extent';
import Layer from 'ol/layer/Layer';
import {Attribution, defaults as defaultControls} from 'ol/control';
import TileGrid from 'ol/tilegrid/TileGrid';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  duration = 1000;
  nveSrsCode = 102100;
  // nveSrsCode = 32633;
  mapSrsCode = 900913
  // mapSrsCode = 32633
  map: Map;
  overlayLayers: Array<Layer<any>>;
  attribution: Attribution;
  overlay: Overlay;
  geolocation: Geolocation;

  debug = false;
  clickAll = true;
  showButtons = false;
  touch = false;

  container = document.getElementById('popup');
  content = document.getElementById('popup-content');
  closer = document.getElementById('popup-closer');

  constructor() { 
    this.map = new Map({});
    this.attribution = new Attribution({
      collapsible: false,
    });
    this.overlay = new Overlay({});
    this.geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true
      },
      projection: 'EPSG:' + this.mapSrsCode
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
    const nveUrl = 'https://nve.geodataonline.no/arcgis/rest/services/Mapservices/Elspot/MapServer/export?'
    const properties = {
      'dpi': '96',
      'transparent': 'true',
      'format': 'png32',
      'bboxSR': this.nveSrsCode,
      'imageSR': this.nveSrsCode,
      'size': '256,256',
      'f': 'image'
    };

    const elspotLayer = new TileLayer({
      source: new TileWMS({
        attributions: ['ElSpot'],
        url: nveUrl,
        params: Object.assign({'layers': 'show:0'}, properties)
      }),
      maxZoom: 11,
      visible: true
    });
    elspotLayer.set('name', 'ElSpot');

    this.overlayLayers = [
      elspotLayer,
    ];

  }

  ngOnInit(): void {
    this.map = new Map({
      controls: defaultControls({attribution: false, zoom: false}).extend([this.attribution]),
      layers: [
        new TileLayer({
          source: new OSM(),
        })
      ],
      target: 'map',
      view: new View({
        center: [1009000, 8414000],
        zoom: 3,
        projection: `EPSG:${this.mapSrsCode}`
      }),
    });

    this.overlayLayers.forEach((layer: Layer<any>) => {
      this.map.addLayer(layer);
    });

    this.geolocation.on('change', () => {
      let position = this.geolocation.getPosition();
      let accuracy = this.geolocation.getAccuracy();
      this.geolocation.setTracking(false);
      if (!position || accuracy === undefined) return;
      let extent: Extent = [
        position[0] - 5*accuracy,
        position[1] - 5*accuracy,
        position[0] + 5*accuracy,
        position[1] + 5*accuracy
      ];
      // console.log(this.geolocation.getPosition(), this.geolocation.getAccuracy());
      const self = this;
      this.map.getView().fit(extent, { duration: this.duration, size: this.map.getSize(), callback: () => {
        self.map.getView().animate({ center: position, duration: self.duration });
        setTimeout(self.focusMap, 10);
      } });
    });

    this.map.on('singleclick', this.clickMap);

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
    let extent: Extent = [430000, 7910000, 3562000, 11555000];
    this.map.getView().fit(extent, { duration: this.duration, size: this.map.getSize() });
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

  clickMap = (evt: any) => {
    let size = this.map.getSize();
    if (!size) return;

    let layers = '';
    for (let i  = 0; i < this.overlayLayers.length; ++i) {
      if (this.clickAll || this.overlayLayers[i].getVisible()) {
        layers += layers.length === 0 ? 'visible:' + i : ',' + i;
      }
    }

    if (layers.length === 0) return;

    const coordinate = evt.coordinate;
    const extent = this.map.getView().calculateExtent();
    // console.log('coord', coordinate);

    // let url = 'https://nve.geodataonline.no/arcgis/rest/services/SkredKvikkleire2/MapServer/identify';
    let url = 'https://nve.geodataonline.no/arcgis/rest/services/Mapservices/Elspot/MapServer/identify'
    url += '?f=json';
    url += '&maxAllowableOffset=15';
    url += '&returnFieldName=true';
    // url += '&returnGeometry=true';
    url += '&returnGeometry=false';
    url += '&returnUnformattedValues=false';
    url += '&returnZ=false';
    // url += '&tolerance=10';
    url += '&tolerance=1';
    url += '&imageDisplay=' + size[0] + ',' + size[1], + ',96';
    url += '&geometry=' + encodeURIComponent('{"x":' + coordinate[0] + ',"y":' + coordinate[1] + '}');
    url += '&geometryType=esriGeometryPoint';
    url += '&sr=' + this.nveSrsCode;
    url += '&mapExtent=' + extent.join(',');
    url += '&layers=' + layers;

    fetch(url)
      .then((response) => { return response.json(); })
      .then((result) => {
        let html = '';
        if (result && result.results) {
          let i = 0;
          result.results.forEach((res: any) => {
            // console.log(res);
            html += '<p>';
            html += '<span style="font-weight: 500;">';
            html += res.layerName;
            html += '</span>'
            html += '<br/>';
            if (res.layerId === 0){
              if (res.displayFieldName) {
                // html += `${res.displayFieldName}: ${this.getElspotAreaName(res.attributes[res.displayFieldName])}`;
                html += `${this.getElspotAreaName(res.attributes[res.displayFieldName])}`;
              }
            }
            let attrHtml = '';
            if (res.attributes) {
              attrHtml = '<br/><span style="cursor: pointer;" onclick="show(' + i + ')">...</span>';
              attrHtml += '<div id="pre_' + i + '" style="display: none; max-height: 200px; max-width: 300px; overflow: auto;"><pre>';
              for(let key in res.attributes) {
                attrHtml += key + ': ' + res.attributes[key];
                attrHtml += '\n';
              }
            }
            attrHtml += '</pre></div>';
            // console.log(
            //   res.layerName,
            //   res.attributes
            // );
            html += attrHtml;
            html += '</p>';
            i++;
          });
        }
        if (this.content) {
          if (html.length === 0) {
            html = '<p>Ingen treff</p>';
            setTimeout(this.closePopup, 1000);
          }
          // console.log(coordinate);
          this.content.innerHTML = html;
          this.overlay.setPosition(coordinate);
        }
      });
  }

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

  toggleLayer = (layer: Layer<any>) => {
    layer.setVisible(!layer.getVisible());
    this.focusMap();
  }

  isVisible = (layer: Layer<any>) => {
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

  getLayerName = (layer: Layer<any>) => {
    return layer.get('name');
  }
}
