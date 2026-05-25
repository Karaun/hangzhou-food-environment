const map = L.map('map', { zoomControl: true }).setView([30.2741, 120.1551], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const COLOR_RAMP = ['#e8fbff', '#c7f4ff', '#8be4ff', '#49c7ff', '#1892ff', '#0a64e8', '#073fae', '#041f63'];
const state = {
  layers: [],
  activeVectorId: null,
  activeRasterId: null,
  compareResult: null,
  charts: {},
  food: {
    autoCsvUrl: 'food_environment.csv',
    layerId: null,
    heatLayer: null,
    currentField: '',
    loaded: false,
  },
};

const DOM = {
  appShell: document.getElementById('appShell'),
  sidebarToggle: document.getElementById('sidebarToggle'),
  foodYearSelect: document.getElementById('foodYearSelect'),
  foodModeSelect: document.getElementById('foodModeSelect'),
  foodMealSelect: document.getElementById('foodMealSelect'),
  foodMetricSelect: document.getElementById('foodMetricSelect'),
  foodHeatToggle: document.getElementById('foodHeatToggle'),
  foodVectorSync: document.getElementById('foodVectorSync'),
  loadFoodDemoBtn: document.getElementById('loadFoodDemoBtn'),
  fitFoodBtn: document.getElementById('fitFoodBtn'),
  foodMetricSummary: document.getElementById('foodMetricSummary'),
  foodStatsPanel: document.getElementById('foodStatsPanel'),
  foodMatrixDetail: document.getElementById('foodMatrixDetail'),
  foodHeatLegend: document.getElementById('foodHeatLegend'),
  selectedCommunityPanel: document.getElementById('selectedCommunityPanel'),
  filterMin: document.getElementById('filterMin'),
  filterMax: document.getElementById('filterMax'),
  mapLayerHint: document.getElementById('mapLayerHint'),
  mapVectorHint: document.getElementById('mapVectorHint'),
  mapRasterHint: document.getElementById('mapRasterHint'),
  geojsonFile: document.getElementById('geojsonFile'),
  csvFile: document.getElementById('csvFile'),
  shpFile: document.getElementById('shpFile'),
  tiffFile: document.getElementById('tiffFile'),
  layerList: document.getElementById('layerList'),
  showPopup: document.getElementById('showPopup'),
  showHighlight: document.getElementById('showHighlight'),
  clearVectorBtn: document.getElementById('clearVectorBtn'),
  clearRasterBtn: document.getElementById('clearRasterBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  keywordInput: document.getElementById('keywordInput'),
  categoryField: document.getElementById('categoryField'),
  categoryValue: document.getElementById('categoryValue'),
  renderField: document.getElementById('renderField'),
  applyFilterBtn: document.getElementById('applyFilterBtn'),
  resetFilterBtn: document.getElementById('resetFilterBtn'),
  activeVectorHint: document.getElementById('activeVectorHint'),
  activeRasterHint: document.getElementById('activeRasterHint'),
  bandSelect: document.getElementById('bandSelect'),
  rasterOpacity: document.getElementById('rasterOpacity'),
  rasterOpacityLabel: document.getElementById('rasterOpacityLabel'),
  classCount: document.getElementById('classCount'),
  classCountLabel: document.getElementById('classCountLabel'),
  resampleMethod: document.getElementById('resampleMethod'),
  refreshRasterBtn: document.getElementById('refreshRasterBtn'),
  fitRasterBtn: document.getElementById('fitRasterBtn'),
  compareBaseSelect: document.getElementById('compareBaseSelect'),
  compareTargetSelect: document.getElementById('compareTargetSelect'),
  compareBaseBand: document.getElementById('compareBaseBand'),
  compareTargetBand: document.getElementById('compareTargetBand'),
  runCompareBtn: document.getElementById('runCompareBtn'),
  swapCompareBtn: document.getElementById('swapCompareBtn'),
  datasetMeta: document.getElementById('datasetMeta'),
  rasterMeta: document.getElementById('rasterMeta'),
  compareMeta: document.getElementById('compareMeta'),
  legendContent: document.getElementById('legendContent'),
  rasterLegend: document.getElementById('rasterLegend'),
  selectedFeature: document.getElementById('selectedFeature'),
  fieldList: document.getElementById('fieldList'),
  categoryStats: document.getElementById('categoryStats'),
  rasterClickInfo: document.getElementById('rasterClickInfo'),
  rasterInfo: document.getElementById('rasterInfo'),
  rasterClassStats: document.getElementById('rasterClassStats'),
  compareResult: document.getElementById('compareResult'),
  statCount: document.getElementById('statCount'),
  statArea: document.getElementById('statArea'),
  statLength: document.getElementById('statLength'),
  statSum: document.getElementById('statSum'),
  statAvg: document.getElementById('statAvg'),
  statMax: document.getElementById('statMax'),
  rasterPixelCount: document.getElementById('rasterPixelCount'),
  rasterMin: document.getElementById('rasterMin'),
  rasterMax: document.getElementById('rasterMax'),
  rasterMean: document.getElementById('rasterMean'),
  rasterCellArea: document.getElementById('rasterCellArea'),
  rasterClassAreaTotal: document.getElementById('rasterClassAreaTotal'),
  vectorCategoryChart: document.getElementById('vectorCategoryChart'),
  vectorTrendChart: document.getElementById('vectorTrendChart'),
  foodTrendChart: document.getElementById('foodTrendChart'),
  foodGroupChart: document.getElementById('foodGroupChart'),
  foodDistrictChart: document.getElementById('foodDistrictChart'),
  rasterClassChart: document.getElementById('rasterClassChart'),
  rasterMultiChart: document.getElementById('rasterMultiChart'),
  compareMetricChart: document.getElementById('compareMetricChart'),
  compareDiffChart: document.getElementById('compareDiffChart'),
  compareTrendChart: document.getElementById('compareTrendChart'),
};

bindEvents();
initTabs();
initSidebarTabs();
initChartSwitchers();
updateRasterSliderLabels();
loadDefaultFoodData();

function toggleSidebar() {
  if (!DOM.appShell) return;
  const collapsed = DOM.appShell.classList.toggle('sidebar-collapsed');
  if (DOM.sidebarToggle) {
    DOM.sidebarToggle.textContent = collapsed ? '›' : '☰';
    DOM.sidebarToggle.title = collapsed ? '展开侧边栏' : '折叠侧边栏';
  }
  setTimeout(() => map.invalidateSize(), 260);
}

function updateMapToolbar() {
  const vectorCount = getVectorLayers().length;
  const rasterCount = getRasterLayers().length;
  const total = vectorCount + rasterCount;
  if (DOM.mapLayerHint) DOM.mapLayerHint.textContent = `${total} 个图层`;
  if (DOM.mapVectorHint) DOM.mapVectorHint.textContent = `矢量 ${vectorCount}`;
  if (DOM.mapRasterHint) DOM.mapRasterHint.textContent = `栅格 ${rasterCount}`;
}

function bindEvents() {
  if (DOM.sidebarToggle && DOM.appShell) DOM.sidebarToggle.addEventListener('click', toggleSidebar);
  [DOM.foodYearSelect, DOM.foodModeSelect, DOM.foodMealSelect, DOM.foodMetricSelect].forEach((control) => {
    if (control) control.addEventListener('change', () => refreshFoodAnalysis({ updateVectorRender: true }));
  });
  if (DOM.foodHeatToggle) DOM.foodHeatToggle.addEventListener('change', () => refreshFoodAnalysis({ updateVectorRender: false }));
  if (DOM.foodVectorSync) DOM.foodVectorSync.addEventListener('change', () => refreshFoodAnalysis({ updateVectorRender: true }));
  if (DOM.loadFoodDemoBtn) DOM.loadFoodDemoBtn.addEventListener('click', () => loadDefaultFoodData(true));
  if (DOM.fitFoodBtn) DOM.fitFoodBtn.addEventListener('click', fitFoodLayer);
  DOM.geojsonFile.addEventListener('change', handleGeoJSONUpload);
  DOM.csvFile.addEventListener('change', handleCSVUpload);
  DOM.shpFile.addEventListener('change', handleShpUpload);
  DOM.tiffFile.addEventListener('change', handleTiffUpload);
  DOM.applyFilterBtn.addEventListener('click', applyFilters);
  DOM.resetFilterBtn.addEventListener('click', resetFilters);
  DOM.clearVectorBtn.addEventListener('click', clearVectorData);
  DOM.clearRasterBtn.addEventListener('click', clearRasterData);
  DOM.clearAllBtn.addEventListener('click', clearAllData);
  DOM.showPopup.addEventListener('change', () => {
    renderAllVectorLayers();
    updateVectorUI();
  });
  DOM.showHighlight.addEventListener('change', () => {
    getVectorLayers().forEach((layer) => {
      if (!DOM.showHighlight.checked && layer.selectedLayer) map.removeLayer(layer.selectedLayer);
      if (DOM.showHighlight.checked && layer.selectedLayer && layer.visible) layer.selectedLayer.addTo(map);
    });
  });
  DOM.renderField.addEventListener('change', () => {
    renderAllVectorLayers();
    updateVectorUI();
  });
  DOM.categoryField.addEventListener('change', updateCategoryStats);
  DOM.classCount.addEventListener('input', () => {
    updateRasterSliderLabels();
    const layer = getActiveRasterLayer();
    if (!layer) return;
    layer.classCount = Number(DOM.classCount.value);
    refreshRasterAnalyticsForLayer(layer);
    renderRasterLayerRecord(layer);
    updateRasterUI();
  });
  DOM.rasterOpacity.addEventListener('input', () => {
    updateRasterSliderLabels();
    const layer = getActiveRasterLayer();
    if (!layer) return;
    layer.opacity = Number(DOM.rasterOpacity.value);
    renderRasterLayerRecord(layer);
    updateRasterUI();
  });
  DOM.bandSelect.addEventListener('change', () => {
    const layer = getActiveRasterLayer();
    if (!layer) return;
    layer.bandIndex = Number(DOM.bandSelect.value || 0);
    refreshRasterAnalyticsForLayer(layer);
    renderRasterLayerRecord(layer);
    updateRasterUI();
    refreshCompareBandOptions();
  });
  DOM.resampleMethod.addEventListener('change', () => {
    const layer = getActiveRasterLayer();
    if (!layer) return;
    layer.resampleMethod = DOM.resampleMethod.value;
    renderRasterLayerRecord(layer);
    updateRasterUI();
  });
  DOM.refreshRasterBtn.addEventListener('click', () => {
    const layer = getActiveRasterLayer();
    if (!layer) return;
    layer.bandIndex = Number(DOM.bandSelect.value || 0);
    layer.opacity = Number(DOM.rasterOpacity.value);
    layer.classCount = Number(DOM.classCount.value);
    layer.resampleMethod = DOM.resampleMethod.value;
    refreshRasterAnalyticsForLayer(layer);
    renderRasterLayerRecord(layer);
    updateRasterUI();
  });
  DOM.fitRasterBtn.addEventListener('click', fitRasterBounds);
  DOM.compareBaseSelect.addEventListener('change', refreshCompareBandOptions);
  DOM.compareTargetSelect.addEventListener('change', refreshCompareBandOptions);
  DOM.runCompareBtn.addEventListener('click', runRasterComparison);
  DOM.swapCompareBtn.addEventListener('click', swapCompareLayers);
  map.on('click', handleMapClick);
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
    });
  });
}

function initSidebarTabs() {
  document.querySelectorAll('.sidebar-tab').forEach((button) => {
    button.addEventListener('click', () => {
      if (DOM.appShell?.classList.contains('sidebar-collapsed')) toggleSidebar();
      document.querySelectorAll('.sidebar-tab').forEach((btn) => btn.classList.remove('active'));
      document.querySelectorAll('.sidebar-pane').forEach((pane) => pane.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`side-${button.dataset.sideTab}`).classList.add('active');
    });
  });
}

function initChartSwitchers() {
  document.querySelectorAll('.chart-switcher').forEach((group) => {
    group.querySelectorAll('.chart-switch').forEach((button) => {
      button.addEventListener('click', () => {
        group.querySelectorAll('.chart-switch').forEach((item) => item.classList.remove('active'));
        const panelIds = [...group.querySelectorAll('.chart-switch')].map((item) => item.dataset.chartPanel);
        panelIds.forEach((id) => document.getElementById(id)?.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(button.dataset.chartPanel)?.classList.add('active');
        window.dispatchEvent(new Event('resize'));
      });
    });
  });
}

function getLayerById(id) {
  return state.layers.find((layer) => layer.id === id) || null;
}
function getVectorLayers() { return state.layers.filter((layer) => layer.type === 'vector'); }
function getRasterLayers() { return state.layers.filter((layer) => layer.type === 'raster'); }
function getActiveVectorLayer() { return getLayerById(state.activeVectorId); }
function getActiveRasterLayer() { return getLayerById(state.activeRasterId); }
function createLayerId(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

async function handleGeoJSONUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const normalized = normalizeSpatialJSON(json);
    addVectorLayer(normalized.geojson, file.name, normalized.sourceFormat);
  } catch (error) {
    alert(`矢量导入失败：${error.message}`);
  } finally {
    DOM.geojsonFile.value = '';
  }
}

async function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) throw new Error('CSV 内容为空。');
    const geojson = csvToGeoJSON(rows);
    addVectorLayer(geojson, file.name, 'CSV 转点');
    const layer = getActiveVectorLayer();
    if (isFoodLayer(layer)) {
      state.food.layerId = layer.id;
      state.food.loaded = true;
      refreshFoodAnalysis({ updateVectorRender: true });
    }
  } catch (error) {
    alert(`CSV 导入失败：${error.message}`);
  } finally {
    DOM.csvFile.value = '';
  }
}

async function handleShpUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (typeof shp === 'undefined') throw new Error('Shapefile 解析依赖未加载，请刷新页面后重试。');
    const arrayBuffer = await file.arrayBuffer();
    const parsed = await shp(arrayBuffer);
    const collections = Array.isArray(parsed) ? parsed : [parsed];
    let added = 0;
    collections.forEach((item, index) => {
      const geojson = item?.type === 'FeatureCollection' ? item : (item?.features ? { type: 'FeatureCollection', features: item.features } : null);
      if (!geojson?.features?.length) return;
      const partName = item?.fileName ? ` · ${item.fileName}` : (collections.length > 1 ? ` · 图层${index + 1}` : '');
      addVectorLayer(geojson, `${file.name}${partName}`, 'Shapefile');
      added += 1;
    });
    if (!added) throw new Error('未解析到有效要素。请优先上传包含 shp、dbf、prj 的 zip 包。');
  } catch (error) {
    console.error(error);
    alert(`SHP 导入失败：${error.message || '请优先上传包含 shp、dbf、prj 的 zip 包。'}`);
  } finally {
    DOM.shpFile.value = '';
  }
}

async function handleTiffUpload(event) {
  const files = [...(event.target.files || [])];
  if (!files.length) return;
  try {
    if (typeof proj4 === 'undefined') throw new Error('proj4 依赖未加载，请刷新页面后重试。');
    if (typeof parseGeoraster === 'undefined') throw new Error('parseGeoraster 依赖未加载，请检查网络后刷新页面。');

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const georaster = await parseGeoraster(arrayBuffer);
      if (!georaster || !georaster.values || !georaster.values.length) {
        throw new Error(`${file.name} 未能解析有效的 GeoTIFF 像元数据。`);
      }
      optimizeSpatialReferenceForCGCS2000(georaster);
      addRasterLayer(georaster, file.name);
    }
  } catch (error) {
    console.error(error);
    alert(`GeoTIFF 导入失败：${error.message || '请确认该 TIF 带有空间参考且文件未损坏。'}`);
  } finally {
    DOM.tiffFile.value = '';
  }
}

function optimizeSpatialReferenceForCGCS2000(georaster) {
  const projection = String(georaster.projection || '').toUpperCase();
  const looksGeographic = isLikelyLonLatBounds(georaster);
  if (!projection && looksGeographic) {
    georaster.projection = 4326;
    georaster.assumedProjectionName = 'CGCS2000 / EPSG:4490（地理坐标系，按坐标范围自动识别）';
    return;
  }
  if (projection.includes('4490') || projection.includes('CGCS2000') || projection.includes('CGCS 2000') || projection === 'GEOGRAPHIC' || projection.includes('4326') || projection === 'WGS84' || (looksGeographic && !projection.includes('3857'))) {
    georaster.projection = 4326;
    georaster.assumedProjectionName = projection.includes('4490') || projection.includes('CGCS2000') || projection.includes('CGCS 2000') ? 'CGCS2000 / EPSG:4490（地理坐标系）' : 'CGCS2000 / EPSG:4490（地理坐标系，兼容经纬度范围）';
    return;
  }
  georaster.assumedProjectionName = projection || '未知投影';
}

function isLikelyLonLatBounds(georaster) {
  const xmin = Number(georaster.xmin);
  const xmax = Number(georaster.xmax);
  const ymin = Number(georaster.ymin);
  const ymax = Number(georaster.ymax);
  return [xmin, xmax, ymin, ymax].every(Number.isFinite)
    && xmin >= -180 && xmax <= 180 && ymin >= -90 && ymax <= 90;
}

function addVectorLayer(geojson, fileName, sourceFormat) {
  const layerRecord = {
    id: createLayerId('vector'),
    type: 'vector',
    name: fileName || '未命名矢量',
    sourceFormat: sourceFormat || 'GeoJSON',
    rawGeoJSON: geojson,
    currentGeoJSON: geojson,
    visible: true,
    fields: extractFields(geojson),
    numericFields: extractNumericFields(geojson),
    leafletLayer: null,
    selectedLayer: null,
    selectedFeature: null,
    searchActive: false,
  };
  state.layers.push(layerRecord);
  state.activeVectorId = layerRecord.id;
  renderSingleVectorLayer(layerRecord);
  renderLayerList();
  updateVectorUI();
  fitToVisibleData();
}

function addRasterLayer(georaster, fileName) {
  const layerRecord = {
    id: createLayerId('raster'),
    type: 'raster',
    name: fileName || '未命名栅格',
    sourceFormat: georaster.assumedProjectionName ? `GeoTIFF ｜ ${georaster.assumedProjectionName}` : 'GeoTIFF',
    georaster,
    visible: true,
    rasterLayer: null,
    rasterBandStats: [],
    rasterClassStats: [],
    lastRasterClick: null,
    bandIndex: 0,
    opacity: Number(DOM.rasterOpacity.value),
    classCount: Number(DOM.classCount.value),
    resampleMethod: DOM.resampleMethod.value,
  };
  refreshRasterAnalyticsForLayer(layerRecord);
  state.layers.push(layerRecord);
  state.activeRasterId = layerRecord.id;
  syncRasterControlsFromLayer(layerRecord);
  renderRasterLayerRecord(layerRecord);
  renderLayerList();
  updateRasterUI();
  fitRasterBounds();
}

function renderLayerList() {
  updateMapToolbar();
  if (!state.layers.length) {
    DOM.layerList.className = 'layer-list-panel empty-state';
    DOM.layerList.textContent = '还没有导入图层。';
    return;
  }
  DOM.layerList.className = 'layer-list-panel';
  DOM.layerList.innerHTML = [...state.layers].reverse().map((layer) => {
    const isVectorActive = layer.id === state.activeVectorId;
    const isRasterActive = layer.id === state.activeRasterId;
    const isActive = layer.type === 'vector' ? isVectorActive : isRasterActive;
    const badge = layer.type === 'vector' ? '矢量' : '栅格';
    const activeText = isActive ? '当前分析图层' : '设为分析图层';
    return `
      <div class="layer-item ${isActive ? 'active' : ''}" data-layer-id="${layer.id}">
        <div class="layer-item-head">
          <button class="layer-name-btn" data-action="activate" data-layer-id="${layer.id}" title="${escapeHTML(layer.name)}">${escapeHTML(layer.name)}</button>
          <span class="layer-badge ${layer.type}">${badge}</span>
        </div>
        <div class="layer-meta">${escapeHTML(layer.sourceFormat || '-')}</div>
        <div class="layer-actions">
          <label class="layer-toggle">
            <input type="checkbox" data-action="toggle" data-layer-id="${layer.id}" ${layer.visible ? 'checked' : ''} />
            <span>${layer.visible ? '显示中' : '已隐藏'}</span>
          </label>
          <button class="mini-btn" data-action="activate" data-layer-id="${layer.id}">${activeText}</button>
          <button class="mini-btn danger" data-action="delete" data-layer-id="${layer.id}">删除</button>
        </div>
      </div>`;
  }).join('');

  DOM.layerList.querySelectorAll('[data-action="activate"]').forEach((button) => {
    button.addEventListener('click', () => activateLayer(button.dataset.layerId));
  });
  DOM.layerList.querySelectorAll('[data-action="toggle"]').forEach((input) => {
    input.addEventListener('change', () => setLayerVisibility(input.dataset.layerId, input.checked));
  });
  DOM.layerList.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => deleteLayer(button.dataset.layerId));
  });
  refreshCompareSelectors();
}

function activateLayer(layerId) {
  const layer = getLayerById(layerId);
  if (!layer) return;
  if (layer.type === 'vector') state.activeVectorId = layer.id;
  if (layer.type === 'raster') {
    state.activeRasterId = layer.id;
    syncRasterControlsFromLayer(layer);
  }
  renderLayerList();
  updateVectorUI();
  updateRasterUI();
}

function setLayerVisibility(layerId, visible) {
  const layer = getLayerById(layerId);
  if (!layer) return;
  layer.visible = visible;
  if (layer.type === 'vector') {
    if (layer.leafletLayer) visible ? layer.leafletLayer.addTo(map) : map.removeLayer(layer.leafletLayer);
    if (layer.selectedLayer) {
      if (visible && DOM.showHighlight.checked) layer.selectedLayer.addTo(map);
      else map.removeLayer(layer.selectedLayer);
    }
  } else if (layer.rasterLayer) {
    visible ? layer.rasterLayer.addTo(map) : map.removeLayer(layer.rasterLayer);
  }
  renderLayerList();
  updateRasterUI();
  fitToVisibleData();
}

function deleteLayer(layerId) {
  const layer = getLayerById(layerId);
  if (!layer) return;
  cleanupLayerFromMap(layer);
  if (state.food.layerId === layerId) {
    removeFoodHeatLayer();
    state.food.layerId = null;
    state.food.loaded = false;
  }
  state.layers = state.layers.filter((item) => item.id !== layerId);
  if (layer.type === 'vector' && state.activeVectorId === layerId) state.activeVectorId = getVectorLayers()[0]?.id || null;
  if (layer.type === 'raster' && state.activeRasterId === layerId) state.activeRasterId = getRasterLayers()[0]?.id || null;
  renderLayerList();
  updateVectorUI();
  updateRasterUI();
  if (state.compareResult && (state.compareResult.baseLayerId === layerId || state.compareResult.targetLayerId === layerId)) {
    state.compareResult = null;
    updateCompareUI();
  }
  fitToVisibleData();
}

function cleanupLayerFromMap(layer) {
  if (layer.type === 'vector') {
    if (layer.leafletLayer) map.removeLayer(layer.leafletLayer);
    if (layer.selectedLayer) map.removeLayer(layer.selectedLayer);
  }
  if (layer.type === 'raster') {
    if (layer.rasterLayer) map.removeLayer(layer.rasterLayer);
  }
}

function clearVectorData() {
  removeFoodHeatLayer();
  state.food.layerId = null;
  state.food.loaded = false;
  getVectorLayers().forEach(cleanupLayerFromMap);
  state.layers = state.layers.filter((layer) => layer.type !== 'vector');
  state.activeVectorId = null;
  renderLayerList();
  updateVectorUI();
  fitToVisibleData();
}

function clearRasterData() {
  getRasterLayers().forEach(cleanupLayerFromMap);
  state.layers = state.layers.filter((layer) => layer.type !== 'raster');
  state.activeRasterId = null;
  state.compareResult = null;
  renderLayerList();
  updateRasterUI();
  updateCompareUI();
  fitToVisibleData();
}

function clearAllData() {
  removeFoodHeatLayer();
  state.food.layerId = null;
  state.food.loaded = false;
  state.layers.forEach(cleanupLayerFromMap);
  state.layers = [];
  state.activeVectorId = null;
  state.activeRasterId = null;
  state.compareResult = null;
  renderLayerList();
  updateVectorUI();
  updateRasterUI();
  updateCompareUI();
}

function applyFilters() {
  const layer = getActiveVectorLayer();
  if (!layer) return;
  const keyword = DOM.keywordInput?.value.trim().toLowerCase() || '';
  const categoryField = DOM.categoryField?.value || '';
  const categoryValue = DOM.categoryValue?.value.trim().toLowerCase() || '';
  const numericField = DOM.renderField?.value || '';
  const minValue = DOM.filterMin?.value === '' ? null : Number(DOM.filterMin?.value);
  const maxValue = DOM.filterMax?.value === '' ? null : Number(DOM.filterMax?.value);
  const hasRange = numericField && (Number.isFinite(minValue) || Number.isFinite(maxValue));
  const features = layer.rawGeoJSON.features.filter((feature) => {
    const props = feature.properties || {};
    const keywordFields = ['小区', '地址', '行政区', '城市', '省'];
    const keywordPool = keywordFields.map((key) => props[key]).filter((value) => value != null && value !== '');
    const keywordMatch = !keyword || keywordPool.some((value) => String(value).toLowerCase().includes(keyword))
      || Object.values(props).some((value) => String(value).toLowerCase().includes(keyword));
    const categoryMatch = !categoryField || !categoryValue || String(props[categoryField] ?? '').toLowerCase().includes(categoryValue);
    let rangeMatch = true;
    if (hasRange) {
      const numericValue = Number(props[numericField]);
      rangeMatch = Number.isFinite(numericValue)
        && (!Number.isFinite(minValue) || numericValue >= minValue)
        && (!Number.isFinite(maxValue) || numericValue <= maxValue);
    }
    return keywordMatch && categoryMatch && rangeMatch;
  });
  layer.currentGeoJSON = { type: 'FeatureCollection', features };
  layer.searchActive = Boolean(keyword || categoryValue || hasRange);
  layer.selectedFeature = null;
  if (layer.selectedLayer) {
    map.removeLayer(layer.selectedLayer);
    layer.selectedLayer = null;
  }
  renderSingleVectorLayer(layer);
  updateVectorUI();
  if (isFoodLayer(layer)) refreshFoodAnalysis({ updateVectorRender: false });
  fitToVisibleData();
}

function resetFilters() {
  DOM.keywordInput.value = '';
  DOM.categoryField.value = '';
  DOM.categoryValue.value = '';
  DOM.renderField.value = '';
  if (DOM.filterMin) DOM.filterMin.value = '';
  if (DOM.filterMax) DOM.filterMax.value = '';
  if (DOM.selectedCommunityPanel) DOM.selectedCommunityPanel.innerHTML = '点击地图上的小区点位后，这里会显示该小区在当前指标与三期时间截面下的数值。';
  const layer = getActiveVectorLayer();
  if (!layer) {
    updateVectorUI();
    return;
  }
  layer.currentGeoJSON = layer.rawGeoJSON;
  layer.searchActive = false;
  layer.selectedFeature = null;
  if (layer.selectedLayer) {
    map.removeLayer(layer.selectedLayer);
    layer.selectedLayer = null;
  }
  if (isFoodLayer(layer)) {
    refreshFoodAnalysis({ updateVectorRender: true });
  } else {
    renderAllVectorLayers();
    updateVectorUI();
  }
  fitToVisibleData();
}

function renderAllVectorLayers() { getVectorLayers().forEach(renderSingleVectorLayer); }

function renderSingleVectorLayer(layer) {
  if (layer.leafletLayer) map.removeLayer(layer.leafletLayer);
  if (layer.selectedLayer) {
    map.removeLayer(layer.selectedLayer);
    layer.selectedLayer = null;
  }
  if (!layer.currentGeoJSON || !layer.currentGeoJSON.features.length) return;

  const isActive = layer.id === state.activeVectorId;
  const renderField = isActive ? DOM.renderField.value : '';
  const values = getNumericValues(layer.currentGeoJSON, renderField);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const searchActive = Boolean(layer.searchActive && isActive && layer.currentGeoJSON.features.length);

  layer.leafletLayer = L.geoJSON(layer.currentGeoJSON, {
    style: (feature) => polygonLineStyle(feature, renderField, min, max, isActive, searchActive),
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, pointStyle(feature, renderField, min, max, isActive, searchActive)),
    onEachFeature: (feature, leafletLayer) => {
      if (DOM.showPopup.checked) leafletLayer.bindPopup(buildPopupHTML(feature.properties || {}));
      leafletLayer.on('click', () => {
        state.activeVectorId = layer.id;
        layer.selectedFeature = feature;
        renderLayerList();
        if (DOM.showHighlight.checked) highlightFeature(layer, feature);
        if (isFoodLayer(layer)) renderSelectedCommunityCard(feature);
        updateVectorUI();
      });
    }
  });
  if (layer.visible) layer.leafletLayer.addTo(map);
  if (layer.selectedFeature && DOM.showHighlight.checked) highlightFeature(layer, layer.selectedFeature);
}

function renderRasterLayerRecord(layer) {
  if (!layer.georaster) return;
  if (layer.rasterLayer) {
    map.removeLayer(layer.rasterLayer);
    layer.rasterLayer = null;
  }
  try {
    layer.rasterLayer = new GeoRasterLayer({
      georaster: layer.georaster,
      opacity: layer.opacity,
      resolution: 256,
      resampleMethod: layer.resampleMethod,
      pixelValuesToColorFn: (pixelValues) => {
        if (!pixelValues || !pixelValues.length) return null;
        const value = pixelValues[layer.bandIndex];
        const stats = getCurrentBandStats(layer);
        return colorForRasterValue(value, stats, layer.rasterClassStats);
      }
    });
  } catch (error) {
    console.error(error);
    alert('栅格图层创建失败，请确认浏览器联网并成功加载 GeoRaster 相关库。');
    return;
  }
  if (layer.visible) layer.rasterLayer.addTo(map);
}

function updateVectorUI() {
  const layer = getActiveVectorLayer();
  if (!layer) {
    DOM.activeVectorHint.textContent = '当前未选择矢量分析图层';
    DOM.datasetMeta.textContent = '当前未加载矢量数据';
    DOM.selectedFeature.innerHTML = '<div class="empty-state">点击矢量要素后，这里会显示详细属性。</div>';
    DOM.fieldList.innerHTML = '<div class="empty-state">导入矢量数据后显示字段列表。</div>';
    DOM.categoryStats.innerHTML = '<div class="empty-state">选择分类字段后显示统计结果。</div>';
    DOM.legendContent.textContent = '未选择专题字段';
    if (DOM.selectedCommunityPanel) DOM.selectedCommunityPanel.innerHTML = '点击地图上的小区点位后，这里会显示该小区在当前指标与三期时间截面下的数值。';
    DOM.categoryField.innerHTML = '<option value="">请选择字段</option>';
    DOM.renderField.innerHTML = '<option value="">请选择数值字段</option>';
    resetVectorStatsUI();
    clearChartGroup(['vectorCategoryChart', 'vectorTrendChart']);
    return;
  }
  DOM.activeVectorHint.textContent = `当前分析图层：${layer.name}`;
  populateFieldSelectors(layer);
  renderSelectedFeature(layer.selectedFeature);
  renderFieldList(layer);
  updateCategoryStats();
  updateStats(layer);
  updateLegend(layer);
  updateVectorMeta(layer);
  renderVectorCharts(layer);
  if (isFoodLayer(layer)) {
    renderFoodDashboard(layer);
    syncFoodPointVisibility(layer, false);
  }
}


function isFoodLayer(layer) {
  return Boolean(layer && layer.fields && layer.fields.some((field) => /^20(19|23|25)年(线上送餐|线下步行)(快餐|正餐)(可达性|可得性|平均价格|可选择性)$/.test(field)));
}

function getFoodLayer() {
  if (state.food.layerId) {
    const existing = getLayerById(state.food.layerId);
    if (existing) return existing;
  }
  const fallback = getVectorLayers().find(isFoodLayer) || null;
  if (fallback) state.food.layerId = fallback.id;
  return fallback;
}

function getFoodField() {
  const year = DOM.foodYearSelect?.value || '2025';
  const mode = DOM.foodModeSelect?.value || '线上送餐';
  const meal = DOM.foodMealSelect?.value || '快餐';
  const metric = DOM.foodMetricSelect?.value || '可达性';
  return `${year}年${mode}${meal}${metric}`;
}

function getFoodLabel() {
  const year = DOM.foodYearSelect?.value || '2025';
  const mode = (DOM.foodModeSelect?.value || '线上送餐').replace('送餐', '').replace('步行', '');
  const meal = DOM.foodMealSelect?.value || '快餐';
  const metric = DOM.foodMetricSelect?.value || '可达性';
  return `${year}年 ${mode} · ${meal} · ${metric}`;
}

async function loadDefaultFoodData(showNotice = false) {
  if (!DOM.foodMetricSummary) return;
  try {
    const existing = getFoodLayer();
    if (existing && state.food.loaded && !showNotice) {
      refreshFoodAnalysis({ updateVectorRender: true });
      return;
    }
    if (showNotice && existing) {
      deleteLayer(existing.id);
    }
    DOM.foodMetricSummary.innerHTML = '<div class="empty-state">正在加载内置小区食物环境数据……</div>';
    const response = await fetch(state.food.autoCsvUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = parseCSV(text);
    if (!rows.length) throw new Error('CSV 内容为空。');
    const geojson = csvToGeoJSON(rows);
    addVectorLayer(geojson, '小区食物环境计算结果2.csv', 'CSV 演示数据｜小区点位｜WGS84');
    const layer = getActiveVectorLayer();
    state.food.layerId = layer?.id || null;
    state.food.loaded = true;
    if (DOM.categoryField && layer?.fields.includes('行政区')) DOM.categoryField.value = '行政区';
    refreshFoodAnalysis({ updateVectorRender: true });
    const foodTab = document.querySelector('[data-tab="food"]');
    if (foodTab) foodTab.click();
    if (showNotice) console.info('食物环境演示数据已重新加载。');
  } catch (error) {
    console.warn('默认食物环境 CSV 加载失败', error);
    DOM.foodMetricSummary.innerHTML = `<div class="empty-state">默认 CSV 自动加载失败。部署到 Render/GitHub 后通常可直接读取；本地预览请用 VS Code Live Server 或 Python HTTP Server 打开。也可在左侧“数据加载与小区检索”中手动上传 CSV。错误：${escapeHTML(error.message || String(error))}</div>`;
    if (DOM.foodHeatLegend) DOM.foodHeatLegend.textContent = '等待加载 CSV';
  }
}

function refreshFoodAnalysis(options = {}) {
  const { updateVectorRender = false } = options;
  const layer = getFoodLayer();
  if (!layer) {
    if (DOM.foodMetricSummary) DOM.foodMetricSummary.innerHTML = '<div class="empty-state">尚未加载食物环境 CSV。请点击“重新加载演示数据”，或在左侧上传带 lng/lat 的 CSV。</div>';
    if (DOM.foodStatsPanel) DOM.foodStatsPanel.innerHTML = '<div class="empty-state">等待食物环境点位数据。</div>';
    removeFoodHeatLayer();
    clearChartGroup(['foodTrendChart', 'foodGroupChart', 'foodDistrictChart']);
    return;
  }
  state.food.layerId = layer.id;
  state.activeVectorId = layer.id;
  const field = getFoodField();
  state.food.currentField = field;
  if (updateVectorRender) {
    if (layer.numericFields.includes(field)) DOM.renderField.value = field;
    if (layer.fields.includes('行政区')) DOM.categoryField.value = '行政区';
    renderAllVectorLayers();
  }
  renderFoodDashboard(layer);
  syncFoodPointVisibility(layer, false);
  if (updateVectorRender) {
    renderLayerList();
    updateVectorUI();
    syncFoodPointVisibility(layer, true);
  }
}

function renderFoodDashboard(layer) {
  const field = getFoodField();
  if (!layer || !layer.fields.includes(field)) {
    if (DOM.foodMetricSummary) DOM.foodMetricSummary.innerHTML = `<div class="empty-state">当前组合没有匹配字段：${escapeHTML(field)}</div>`;
    removeFoodHeatLayer();
    clearChartGroup(['foodTrendChart', 'foodGroupChart', 'foodDistrictChart']);
    return;
  }
  renderFoodHeatmap(layer, field);
  renderFoodStats(layer, field);
  renderFoodCharts(layer, field);
}

function getFoodFeatures(layer) {
  if (!layer) return [];
  if (layer.searchActive) return layer.currentGeoJSON?.features || [];
  return layer.currentGeoJSON?.features?.length ? layer.currentGeoJSON.features : layer.rawGeoJSON?.features || [];
}

function getFeatureLngLat(feature) {
  const props = feature.properties || {};
  const lng = Number(props.lng ?? props.LNG ?? props.lon ?? props.longitude);
  const lat = Number(props.lat ?? props.LAT ?? props.latitude);
  if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
  if (feature.geometry?.type === 'Point') {
    const [x, y] = feature.geometry.coordinates || [];
    if (Number.isFinite(Number(x)) && Number.isFinite(Number(y))) return { lng: Number(x), lat: Number(y) };
  }
  return null;
}

function getFoodValues(layer, field) {
  return getFoodFeatures(layer).map((feature) => Number(feature.properties?.[field])).filter(Number.isFinite);
}

function summarizeValues(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, value) => acc + value, 0);
  const quantile = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)))];
  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / values.length,
    median: quantile(0.5),
    p75: quantile(0.75),
    p90: quantile(0.9),
  };
}

function renderFoodHeatmap(layer, field) {
  removeFoodHeatLayer();
  const showHeat = DOM.foodHeatToggle?.checked !== false;
  const features = getFoodFeatures(layer);
  const values = features.map((feature) => Number(feature.properties?.[field])).filter(Number.isFinite);
  const summary = summarizeValues(values);
  if (!showHeat || !summary || typeof L.heatLayer !== 'function') {
    if (DOM.foodHeatLegend) DOM.foodHeatLegend.textContent = showHeat ? '热力图库未加载；可使用小区点位分级展示。' : '热力图已关闭，当前显示小区点位。';
    return;
  }
  const span = summary.max - summary.min || 1;
  const heatPoints = [];
  features.forEach((feature) => {
    const value = Number(feature.properties?.[field]);
    const coord = getFeatureLngLat(feature);
    if (!coord || !Number.isFinite(value)) return;
    const weight = summary.max === summary.min ? 0.65 : clamp((value - summary.min) / span, 0.05, 1);
    heatPoints.push([coord.lat, coord.lng, weight]);
  });
  if (!heatPoints.length) {
    if (DOM.foodHeatLegend) DOM.foodHeatLegend.textContent = '当前指标没有可用经纬度点位。';
    return;
  }
  state.food.heatLayer = L.heatLayer(heatPoints, {
    radius: 24,
    blur: 28,
    maxZoom: 17,
    minOpacity: 0.28,
    gradient: { 0.15: '#c7f4ff', 0.35: '#49c7ff', 0.62: '#1892ff', 0.84: '#0a64e8', 1: '#041f63' },
  }).addTo(map);
  if (DOM.foodHeatLegend) {
    DOM.foodHeatLegend.innerHTML = `
      <div class="heat-legend-title">${escapeHTML(getFoodLabel())}</div>
      <div class="heat-gradient"></div>
      <div class="heat-scale"><span>低值 ${formatMaybeNumber(summary.min)}</span><span>高值 ${formatMaybeNumber(summary.max)}</span></div>
    `;
  }
}

function removeFoodHeatLayer() {
  if (state.food?.heatLayer) {
    try { map.removeLayer(state.food.heatLayer); } catch (error) { console.warn('移除热力图失败', error); }
    state.food.heatLayer = null;
  }
}

function syncFoodPointVisibility(layer, updateList = false) {
  if (!layer || !isFoodLayer(layer)) return;
  const showHeat = DOM.foodHeatToggle?.checked !== false;
  const showPointLayer = DOM.foodVectorSync?.checked === true;
  const searchActive = Boolean(layer.searchActive && layer.currentGeoJSON?.features?.length);
  const shouldShowPoints = showPointLayer || !showHeat || searchActive;
  layer.visible = shouldShowPoints;
  if (layer.leafletLayer) {
    try {
      if (shouldShowPoints) {
        layer.leafletLayer.addTo(map);
        if (typeof layer.leafletLayer.bringToFront === 'function') layer.leafletLayer.bringToFront();
      } else {
        map.removeLayer(layer.leafletLayer);
      }
    } catch (error) {
      console.warn('同步小区点位显示状态失败', error);
    }
  }
  if (layer.selectedLayer) {
    try {
      if (shouldShowPoints && DOM.showHighlight?.checked) layer.selectedLayer.addTo(map);
      else map.removeLayer(layer.selectedLayer);
    } catch (error) {
      console.warn('同步选中小区显示状态失败', error);
    }
  }
  updateMapToolbar();
  if (updateList) renderLayerList();
}

function renderFoodStats(layer, field) {
  const values = getFoodValues(layer, field);
  const summary = summarizeValues(values);
  const features = getFoodFeatures(layer);
  const districtCount = new Set(features.map((feature) => feature.properties?.行政区).filter(Boolean)).size;
  const label = getFoodLabel();
  if (!summary) {
    if (DOM.foodMetricSummary) DOM.foodMetricSummary.innerHTML = `<div class="empty-state">${escapeHTML(label)} 没有可用数值。</div>`;
    if (DOM.foodStatsPanel) DOM.foodStatsPanel.innerHTML = '<div class="empty-state">当前指标无有效数值。</div>';
    return;
  }
  if (DOM.foodMetricSummary) {
    DOM.foodMetricSummary.innerHTML = `
      <div class="food-summary-line"><strong>${escapeHTML(label)}</strong><span>${summary.count} 个小区参与统计</span></div>
      <div class="food-summary-line muted">均值 ${formatMaybeNumber(summary.mean)} ｜ 中位数 ${formatMaybeNumber(summary.median)} ｜ P90 ${formatMaybeNumber(summary.p90)}</div>
      <div class="food-summary-line muted">点击小区点位可查看该小区三期数值；检索结果会以橙色点位突出显示。</div>
    `;
  }
  if (DOM.foodStatsPanel) {
    DOM.foodStatsPanel.innerHTML = `
      <div class="food-stat-card"><span>小区样本</span><strong>${summary.count}</strong><small>覆盖 ${districtCount || '-'} 个行政区</small></div>
      <div class="food-stat-card"><span>均值</span><strong>${formatMaybeNumber(summary.mean)}</strong><small>${escapeHTML(field)}</small></div>
      <div class="food-stat-card"><span>中位数 / P75</span><strong>${formatMaybeNumber(summary.median)}</strong><small>P75：${formatMaybeNumber(summary.p75)}</small></div>
      <div class="food-stat-card"><span>最小 / 最大</span><strong>${formatMaybeNumber(summary.min)}</strong><small>最大：${formatMaybeNumber(summary.max)}</small></div>
    `;
  }
  if (DOM.datasetMeta && isFoodLayer(layer)) {
    DOM.datasetMeta.textContent = `当前矢量：${layer.name} ｜ 小区点位 ${features.length} 个 ｜ 当前指标：${field}`;
  }
}

function averageField(layer, field, filterFn = null) {
  const values = getFoodFeatures(layer)
    .filter((feature) => !filterFn || filterFn(feature))
    .map((feature) => Number(feature.properties?.[field]))
    .filter(Number.isFinite);
  if (!values.length) return null;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function renderFoodCharts(layer, field) {
  renderFoodTrendChart(layer);
  renderFoodGroupChart(layer);
  renderFoodDistrictChart(layer, field);
}

function renderFoodTrendChart(layer) {
  const mode = DOM.foodModeSelect?.value || '线上送餐';
  const meal = DOM.foodMealSelect?.value || '快餐';
  const metric = DOM.foodMetricSelect?.value || '可达性';
  const years = ['2019', '2023', '2025'];
  const data = years.map((year) => averageField(layer, `${year}年${mode}${meal}${metric}`));
  if (data.every((value) => value == null)) {
    clearChartGroup(['foodTrendChart']);
    return;
  }
  renderChart('foodTrendChart', {
    type: 'line',
    data: {
      labels: years.map((year) => `${year}年`),
      datasets: [{
        label: `${mode.replace('送餐', '').replace('步行', '')}${meal}${metric}`,
        data: data.map((value) => value == null ? null : Number(value.toFixed(4))),
        borderColor: '#0a64e8',
        backgroundColor: 'rgba(10, 100, 232, 0.15)',
        pointRadius: 4,
        borderWidth: 2.4,
        tension: 0.28,
        fill: true,
      }],
    },
    options: baseChartOptions(),
  });
}

function renderFoodGroupChart(layer) {
  const year = DOM.foodYearSelect?.value || '2025';
  const metric = DOM.foodMetricSelect?.value || '可达性';
  const groups = [
    ['线上快餐', `${year}年线上送餐快餐${metric}`],
    ['线上正餐', `${year}年线上送餐正餐${metric}`],
    ['线下快餐', `${year}年线下步行快餐${metric}`],
    ['线下正餐', `${year}年线下步行正餐${metric}`],
  ];
  const data = groups.map(([, groupField]) => averageField(layer, groupField));
  if (data.every((value) => value == null)) {
    clearChartGroup(['foodGroupChart']);
    return;
  }
  renderChart('foodGroupChart', {
    type: 'bar',
    data: {
      labels: groups.map(([name]) => name),
      datasets: [{ label: `${year}年${metric}均值`, data: data.map((value) => value == null ? null : Number(value.toFixed(4))), backgroundColor: '#1892ff', borderRadius: 8, maxBarThickness: 34 }],
    },
    options: baseChartOptions({ plugins: { legend: { display: false } } }),
  });
}

function renderFoodDistrictChart(layer, field) {
  const groups = new Map();
  getFoodFeatures(layer).forEach((feature) => {
    const district = feature.properties?.行政区 || '未标注';
    const value = Number(feature.properties?.[field]);
    if (!Number.isFinite(value)) return;
    if (!groups.has(district)) groups.set(district, []);
    groups.get(district).push(value);
  });
  const items = [...groups.entries()].map(([district, values]) => ({
    district,
    count: values.length,
    mean: values.reduce((acc, value) => acc + value, 0) / values.length,
  })).sort((a, b) => b.mean - a.mean).slice(0, 10);
  if (!items.length) {
    clearChartGroup(['foodDistrictChart']);
    return;
  }
  renderChart('foodDistrictChart', {
    type: 'bar',
    data: {
      labels: items.map((item) => item.district),
      datasets: [{ label: '行政区均值', data: items.map((item) => Number(item.mean.toFixed(4))), backgroundColor: '#49c7ff', borderRadius: 7, maxBarThickness: 26 }],
    },
    options: baseChartOptions({ indexAxis: 'y', plugins: { legend: { display: false } } }),
  });
}

function fitFoodLayer() {
  const layer = getFoodLayer();
  if (!layer?.leafletLayer) return;
  try {
    const bounds = layer.leafletLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
  } catch (error) {
    console.warn('缩放到食物环境图层失败', error);
  }
}

function updateRasterUI() {
  const layer = getActiveRasterLayer();
  if (!layer) {
    DOM.activeRasterHint.textContent = '当前未选择栅格分析图层';
    DOM.rasterMeta.textContent = '当前未加载栅格';
    DOM.bandSelect.innerHTML = '<option value="0">波段 1</option>';
    DOM.bandSelect.disabled = true;
    DOM.rasterLegend.textContent = '未加载栅格';
    DOM.rasterClickInfo.innerHTML = '<div class="empty-state compact-empty">点击地图获取当前波段像元值。</div>';
    DOM.rasterInfo.innerHTML = '<div class="empty-state compact-empty">加载 GeoTIFF 后显示范围、分辨率、波段等信息。</div>';
    DOM.rasterClassStats.innerHTML = '<div class="empty-state compact-empty">加载栅格后自动计算分类面积统计。</div>';
    resetRasterStatsUI();
    clearChartGroup(['rasterClassChart', 'rasterMultiChart']);
    refreshCompareSelectors();
    return;
  }
  DOM.activeRasterHint.textContent = `当前分析图层：${layer.name}`;
  syncRasterControlsFromLayer(layer);
  populateBandSelector(layer, DOM.bandSelect, layer.bandIndex);
  updateRasterStatsUI(layer);
  updateRasterLegend(layer);
  renderRasterInfo(layer);
  renderRasterClassStats(layer);
  updateLastRasterClickInfo();
  updateRasterMeta(layer);
  renderRasterCharts(layer);
  refreshCompareSelectors();
}

function refreshCompareSelectors() {
  const rasterLayers = getRasterLayers();
  const currentBase = DOM.compareBaseSelect.value;
  const currentTarget = DOM.compareTargetSelect.value;
  DOM.compareBaseSelect.innerHTML = '<option value="">请选择基准栅格</option>';
  DOM.compareTargetSelect.innerHTML = '<option value="">请选择对比栅格</option>';
  rasterLayers.forEach((layer) => {
    DOM.compareBaseSelect.appendChild(createOption(layer.id, layer.name));
    DOM.compareTargetSelect.appendChild(createOption(layer.id, layer.name));
  });
  if (rasterLayers.some((layer) => layer.id === currentBase)) DOM.compareBaseSelect.value = currentBase;
  else if (state.activeRasterId) DOM.compareBaseSelect.value = state.activeRasterId;
  if (rasterLayers.some((layer) => layer.id === currentTarget) && currentTarget !== DOM.compareBaseSelect.value) DOM.compareTargetSelect.value = currentTarget;
  else {
    const fallback = rasterLayers.find((layer) => layer.id !== DOM.compareBaseSelect.value);
    DOM.compareTargetSelect.value = fallback?.id || '';
  }
  refreshCompareBandOptions();
}

function refreshCompareBandOptions() {
  const baseLayer = getLayerById(DOM.compareBaseSelect.value);
  const targetLayer = getLayerById(DOM.compareTargetSelect.value);
  populateBandSelector(baseLayer, DOM.compareBaseBand, 0);
  populateBandSelector(targetLayer, DOM.compareTargetBand, 0);
}

function swapCompareLayers() {
  const base = DOM.compareBaseSelect.value;
  const target = DOM.compareTargetSelect.value;
  const baseBand = DOM.compareBaseBand.value;
  const targetBand = DOM.compareTargetBand.value;
  DOM.compareBaseSelect.value = target;
  DOM.compareTargetSelect.value = base;
  refreshCompareBandOptions();
  DOM.compareBaseBand.value = targetBand;
  DOM.compareTargetBand.value = baseBand;
}

function runRasterComparison() {
  const baseLayer = getLayerById(DOM.compareBaseSelect.value);
  const targetLayer = getLayerById(DOM.compareTargetSelect.value);
  if (!baseLayer || !targetLayer) {
    alert('请先选择两个栅格图层。');
    return;
  }
  if (baseLayer.id === targetLayer.id) {
    alert('基准栅格和对比栅格不能是同一个图层。');
    return;
  }
  const baseBand = Number(DOM.compareBaseBand.value || 0);
  const targetBand = Number(DOM.compareTargetBand.value || 0);
  try {
    const result = computeRasterComparison(baseLayer, targetLayer, baseBand, targetBand);
    state.compareResult = result;
    updateCompareUI();
    document.querySelector('[data-tab="compare"]').click();
  } catch (error) {
    console.error(error);
    alert(`栅格对比失败：${error.message}`);
  }
}

function updateCompareUI() {
  const result = state.compareResult;
  if (!result) {
    DOM.compareMeta.textContent = '当前未执行栅格对比';
    DOM.compareResult.innerHTML = '<div class="empty-state">导入至少两个栅格后，可在左侧“栅格对比”里执行对比。</div>';
    clearChartGroup(['compareMetricChart', 'compareDiffChart', 'compareTrendChart']);
    return;
  }
  DOM.compareMeta.textContent = `最近对比：${result.baseName}（波段 ${result.baseBand + 1}） vs ${result.targetName}（波段 ${result.targetBand + 1}）｜重叠有效采样 ${result.sampleCount}`;
  const transitionHtml = result.transitions.length
    ? `<details class="details-panel"><summary>展开主要变化转移</summary><div class="details-body"><div class="raster-info-block full-width-block"><div class="compare-bars">${result.transitions.map((item) => `
      <div class="compare-bar-row">
        <div class="compare-bar-head"><strong>${escapeHTML(item.label)}</strong><span>${item.count} 个采样点</span></div>
        <div class="compare-bar"><span style="width:${item.percent}%"></span></div>
      </div>`).join('')}</div></div></div></details>`
    : '';
  DOM.compareResult.innerHTML = `
    <div class="compare-result-wrap">
      <div class="compare-summary-grid compact-grid">
        <div class="compare-stat"><span>基准栅格</span><strong class="compact-strong">${escapeHTML(result.baseName)}</strong><div class="meta-lines">最小值：${formatMaybeNumber(result.baseMin)}<br>均值：${formatMaybeNumber(result.baseMean)}<br>最大值：${formatMaybeNumber(result.baseMax)}</div></div>
        <div class="compare-stat"><span>对比栅格</span><strong class="compact-strong">${escapeHTML(result.targetName)}</strong><div class="meta-lines">最小值：${formatMaybeNumber(result.targetMin)}<br>均值：${formatMaybeNumber(result.targetMean)}<br>最大值：${formatMaybeNumber(result.targetMax)}</div></div>
        <div class="compare-stat"><span>差值统计（对比-基准）</span><strong class="compact-strong">均值 ${formatMaybeNumber(result.diffMean)}</strong><div class="meta-lines">最小差：${formatMaybeNumber(result.diffMin)}<br>最大差：${formatMaybeNumber(result.diffMax)}</div></div>
        <div class="compare-stat"><span>误差与相关性</span><strong class="compact-strong">RMSE ${formatMaybeNumber(result.rmse)}</strong><div class="meta-lines">MAE：${formatMaybeNumber(result.mae)}<br>相关系数：${formatMaybeNumber(result.correlation, 6)}</div></div>
        <div class="compare-stat"><span>采样信息</span><strong class="compact-strong">${result.sampleCount} 个采样点</strong><div class="meta-lines">${result.sampleStrideText}<br>投影：${escapeHTML(result.projectionLabel)}</div></div>
        <div class="compare-stat"><span>数量关系</span><strong class="compact-strong">大于 ${result.greaterCount}</strong><div class="meta-lines">小于：${result.lessCount}<br>相同：${result.equalCount}</div></div>
      </div>
      <details class="details-panel">
        <summary>展开重叠范围与详细说明</summary>
        <div class="details-body">
          <div class="raster-info-block full-width-block">
            <div class="compare-list">
              <div class="compare-card"><strong>重叠范围</strong><div class="value-muted">xmin=${formatNumber(result.overlap.xmin, 6)}, ymin=${formatNumber(result.overlap.ymin, 6)}, xmax=${formatNumber(result.overlap.xmax, 6)}, ymax=${formatNumber(result.overlap.ymax, 6)}</div></div>
              <div class="compare-card"><strong>大于基准</strong><div class="value-muted">${result.greaterCount} 个采样点（${formatPercent(result.greaterCount / Math.max(result.sampleCount, 1))}）</div></div>
              <div class="compare-card"><strong>小于基准</strong><div class="value-muted">${result.lessCount} 个采样点（${formatPercent(result.lessCount / Math.max(result.sampleCount, 1))}）</div></div>
              <div class="compare-card"><strong>相同值</strong><div class="value-muted">${result.equalCount} 个采样点（${formatPercent(result.equalCount / Math.max(result.sampleCount, 1))}）</div></div>
            </div>
          </div>
        </div>
      </details>
      ${transitionHtml}
    </div>
  `;
  renderCompareCharts(result);
}

function computeRasterComparison(baseLayer, targetLayer, baseBand, targetBand) {
  const base = baseLayer.georaster;
  const target = targetLayer.georaster;
  const overlap = {
    xmin: Math.max(Number(base.xmin), Number(target.xmin)),
    ymin: Math.max(Number(base.ymin), Number(target.ymin)),
    xmax: Math.min(Number(base.xmax), Number(target.xmax)),
    ymax: Math.min(Number(base.ymax), Number(target.ymax)),
  };
  if (!(overlap.xmin < overlap.xmax && overlap.ymin < overlap.ymax)) {
    throw new Error('两个栅格没有重叠范围，无法比较。');
  }

  const baseStartCol = clamp(Math.floor((overlap.xmin - Number(base.xmin)) / Math.abs(Number(base.pixelWidth))), 0, base.width - 1);
  const baseEndCol = clamp(Math.ceil((overlap.xmax - Number(base.xmin)) / Math.abs(Number(base.pixelWidth))), 1, base.width);
  const baseStartRow = clamp(Math.floor((Number(base.ymax) - overlap.ymax) / Math.abs(Number(base.pixelHeight))), 0, base.height - 1);
  const baseEndRow = clamp(Math.ceil((Number(base.ymax) - overlap.ymin) / Math.abs(Number(base.pixelHeight))), 1, base.height);

  const maxSamples = 120000;
  const rowSpan = Math.max(1, baseEndRow - baseStartRow);
  const colSpan = Math.max(1, baseEndCol - baseStartCol);
  const step = Math.max(1, Math.ceil(Math.sqrt((rowSpan * colSpan) / maxSamples)));

  const baseStats = getBandStats(baseLayer, baseBand);
  const targetStats = getBandStats(targetLayer, targetBand);
  let sampleCount = 0;
  let baseSum = 0;
  let targetSum = 0;
  let diffSum = 0;
  let absDiffSum = 0;
  let sqDiffSum = 0;
  let diffMin = Infinity;
  let diffMax = -Infinity;
  let baseMin = Infinity;
  let baseMax = -Infinity;
  let targetMin = Infinity;
  let targetMax = -Infinity;
  let greaterCount = 0;
  let lessCount = 0;
  let equalCount = 0;
  let baseSq = 0;
  let targetSq = 0;
  let cross = 0;
  const transitions = new Map();
  const diffSamples = [];
  const integerLike = isIntegerLikeBand(baseLayer, baseBand) && isIntegerLikeBand(targetLayer, targetBand);

  for (let row = baseStartRow; row < baseEndRow; row += step) {
    for (let col = baseStartCol; col < baseEndCol; col += step) {
      const baseValue = readRasterValueByRowCol(baseLayer, baseBand, row, col);
      if (!isValidRasterValue(baseValue, baseStats?.noDataValue)) continue;
      const coord = getCellCenter(base, row, col);
      const targetValue = readRasterValueByCoord(targetLayer, targetBand, coord.lng, coord.lat);
      if (!isValidRasterValue(targetValue, targetStats?.noDataValue)) continue;
      sampleCount += 1;
      baseSum += baseValue;
      targetSum += targetValue;
      if (baseValue < baseMin) baseMin = baseValue;
      if (baseValue > baseMax) baseMax = baseValue;
      if (targetValue < targetMin) targetMin = targetValue;
      if (targetValue > targetMax) targetMax = targetValue;
      baseSq += baseValue * baseValue;
      targetSq += targetValue * targetValue;
      cross += baseValue * targetValue;
      const diff = targetValue - baseValue;
      diffSum += diff;
      absDiffSum += Math.abs(diff);
      sqDiffSum += diff * diff;
      if (diff < diffMin) diffMin = diff;
      if (diff > diffMax) diffMax = diff;
      if (Math.abs(diff) < 1e-9) equalCount += 1;
      else if (diff > 0) greaterCount += 1;
      else lessCount += 1;
      if (diffSamples.length < 6000) diffSamples.push(diff);
      if (integerLike) {
        const key = `${Math.round(baseValue)} → ${Math.round(targetValue)}`;
        transitions.set(key, (transitions.get(key) || 0) + 1);
      }
    }
  }
  if (!sampleCount) throw new Error('重叠区域内没有可用于比较的有效像元。');

  const baseMean = baseSum / sampleCount;
  const targetMean = targetSum / sampleCount;
  const diffMean = diffSum / sampleCount;
  const mae = absDiffSum / sampleCount;
  const rmse = Math.sqrt(sqDiffSum / sampleCount);
  const numerator = sampleCount * cross - baseSum * targetSum;
  const denominator = Math.sqrt((sampleCount * baseSq - baseSum * baseSum) * (sampleCount * targetSq - targetSum * targetSum));
  const correlation = denominator ? numerator / denominator : null;
  const transitionList = [...transitions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, count]) => ({ label, count, percent: (count / sampleCount) * 100 }));
  const projectionLabel = `${projectionDisplay(base)} ｜ ${projectionDisplay(target)}`;
  const diffHistogram = buildHistogram(diffSamples, 12);
  const diffTrend = buildTrendSeries(diffSamples, 24);

  return {
    baseLayerId: baseLayer.id,
    targetLayerId: targetLayer.id,
    baseName: baseLayer.name,
    targetName: targetLayer.name,
    baseBand,
    targetBand,
    overlap,
    sampleCount,
    sampleStrideText: `每 ${step} 像元采样 1 次`,
    baseMean,
    targetMean,
    baseMin: sampleCount ? baseMin : null,
    baseMax: sampleCount ? baseMax : null,
    targetMin: sampleCount ? targetMin : null,
    targetMax: sampleCount ? targetMax : null,
    diffMean,
    mae,
    rmse,
    correlation,
    diffMin: sampleCount ? diffMin : null,
    diffMax: sampleCount ? diffMax : null,
    greaterCount,
    lessCount,
    equalCount,
    transitions: transitionList,
    projectionLabel,
    diffHistogram,
    diffTrend,
  };
}

function getBandStats(layer, bandIndex) {
  return layer?.rasterBandStats?.[bandIndex] || null;
}

function populateFieldSelectors(layer) {
  const currentCategory = DOM.categoryField.value;
  const currentRender = DOM.renderField.value;
  DOM.categoryField.innerHTML = '<option value="">请选择字段</option>';
  DOM.renderField.innerHTML = '<option value="">请选择数值字段</option>';
  layer.fields.forEach((field) => DOM.categoryField.appendChild(createOption(field, field)));
  layer.numericFields.forEach((field) => DOM.renderField.appendChild(createOption(field, field)));
  if (layer.fields.includes(currentCategory)) DOM.categoryField.value = currentCategory;
  if (layer.numericFields.includes(currentRender)) DOM.renderField.value = currentRender;
}

function populateBandSelector(layer, selectElement, preferredValue = 0) {
  selectElement.innerHTML = '';
  if (!layer?.georaster) {
    selectElement.appendChild(createOption('0', '波段 1'));
    selectElement.disabled = true;
    return;
  }
  const count = layer.georaster.numberOfRasters || layer.georaster.values.length;
  for (let i = 0; i < count; i += 1) selectElement.appendChild(createOption(String(i), `波段 ${i + 1}`));
  selectElement.disabled = !count;
  selectElement.value = String(Math.min(preferredValue, Math.max(0, count - 1)));
}

function syncRasterControlsFromLayer(layer) {
  DOM.rasterOpacity.value = String(layer.opacity ?? 0.75);
  DOM.classCount.value = String(layer.classCount ?? 5);
  DOM.resampleMethod.value = layer.resampleMethod || 'nearest';
  updateRasterSliderLabels();
}

function createOption(value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  return option;
}

function updateVectorMeta(layer) {
  const rawCount = layer.rawGeoJSON.features.length;
  const currentCount = layer.currentGeoJSON.features.length;
  DOM.datasetMeta.textContent = `当前矢量：${layer.name} ｜ 格式：${layer.sourceFormat || 'GeoJSON'} ｜ 当前 ${currentCount} / 原始 ${rawCount} 个要素`;
}

function updateRasterMeta(layer) {
  const georaster = layer.georaster;
  const bandCount = georaster.numberOfRasters || georaster.values.length;
  DOM.rasterMeta.textContent = `当前栅格：${layer.name} ｜ ${georaster.width} × ${georaster.height} ｜ ${bandCount} 个波段 ｜ ${projectionDisplay(georaster)}`;
}

function renderSelectedFeature(feature) {
  if (!feature) {
    DOM.selectedFeature.innerHTML = '<div class="empty-state">点击矢量要素后，这里会显示详细属性。</div>';
    return;
  }
  const props = feature.properties || {};
  DOM.selectedFeature.innerHTML = `<div class="detail-list">${Object.entries(props).map(([key, value]) => `
    <div class="detail-item"><strong>${escapeHTML(key)}</strong><div class="value-muted">${escapeHTML(String(value))}</div></div>`).join('')}</div>`;
}

function renderFieldList(layer) {
  if (!layer.fields.length) {
    DOM.fieldList.innerHTML = '<div class="empty-state">导入矢量数据后显示字段列表。</div>';
    return;
  }
  DOM.fieldList.innerHTML = `<div class="field-list">${layer.fields.map((field) => `
    <div class="field-item"><strong>${escapeHTML(field)}</strong><div class="value-muted">${layer.numericFields.includes(field) ? '数值字段' : '文本字段'}</div></div>`).join('')}</div>`;
}

function updateCategoryStats() {
  const layer = getActiveVectorLayer();
  const field = DOM.categoryField.value;
  if (!layer || !field || !layer.currentGeoJSON?.features?.length) {
    DOM.categoryStats.innerHTML = '<div class="empty-state">选择分类字段后显示统计结果。</div>';
    return;
  }
  const counter = new Map();
  layer.currentGeoJSON.features.forEach((feature) => {
    const value = String(feature.properties?.[field] ?? '未分类');
    counter.set(value, (counter.get(value) || 0) + 1);
  });
  const list = [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxCount = list.length ? list[0][1] : 1;
  DOM.categoryStats.innerHTML = `<div class="category-list">${list.map(([name, count]) => `
    <div class="category-item">
      <strong>${escapeHTML(name)}</strong>
      <div class="value-muted">数量：${count}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / maxCount) * 100}%"></div></div>
    </div>`).join('')}</div>`;
}

function updateStats(layer) {
  if (!layer.currentGeoJSON?.features?.length) {
    resetVectorStatsUI();
    return;
  }
  const renderField = DOM.renderField.value;
  let totalArea = 0;
  let totalLength = 0;
  const numericValues = [];
  layer.currentGeoJSON.features.forEach((feature) => {
    try {
      const type = feature.geometry?.type || '';
      if (type.includes('Polygon')) totalArea += turf.area(feature) / 1_000_000;
      if (type.includes('LineString')) totalLength += turf.length(feature, { units: 'kilometers' });
    } catch (error) {
      console.warn('空间统计失败', error);
    }
    const rawValue = Number(feature.properties?.[renderField]);
    if (renderField && Number.isFinite(rawValue)) numericValues.push(rawValue);
  });
  const sum = numericValues.reduce((acc, value) => acc + value, 0);
  const avg = numericValues.length ? sum / numericValues.length : 0;
  const max = numericValues.length ? Math.max(...numericValues) : 0;
  DOM.statCount.textContent = String(layer.currentGeoJSON.features.length);
  DOM.statArea.textContent = totalArea.toFixed(2);
  DOM.statLength.textContent = totalLength.toFixed(2);
  if (DOM.statSum) DOM.statSum.textContent = sum.toFixed(2);
  DOM.statAvg.textContent = avg.toFixed(2);
  DOM.statMax.textContent = max.toFixed(2);
}

function updateLegend(layer) {
  const field = DOM.renderField.value;
  if (!field || !layer.currentGeoJSON?.features?.length) {
    DOM.legendContent.textContent = '未选择专题字段';
    return;
  }
  const values = getNumericValues(layer.currentGeoJSON, field);
  if (!values.length) {
    DOM.legendContent.textContent = '当前字段无有效数值';
    return;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const classCount = 5;
  const step = (max - min) / classCount || 1;
  DOM.legendContent.innerHTML = Array.from({ length: classCount }).map((_, i) => {
    const start = min + step * i;
    const end = i === classCount - 1 ? max : min + step * (i + 1);
    const color = COLOR_RAMP[Math.min(COLOR_RAMP.length - 1, i + 2)];
    return `<div class="legend-item"><span class="legend-color" style="background:${color}"></span><span>${formatNumber(start)} ~ ${formatNumber(end)}</span></div>`;
  }).join('');
}

function resetVectorStatsUI() {
  DOM.statCount.textContent = '0';
  DOM.statArea.textContent = '0.00';
  DOM.statLength.textContent = '0.00';
  if (DOM.statSum) DOM.statSum.textContent = '0.00';
  DOM.statAvg.textContent = '0.00';
  DOM.statMax.textContent = '0.00';
}

function refreshRasterAnalyticsForLayer(layer) {
  if (!layer.georaster) {
    layer.rasterBandStats = [];
    layer.rasterClassStats = [];
    return;
  }
  layer.rasterBandStats = computeRasterStats(layer.georaster);
  layer.rasterClassStats = computeRasterClassStats(layer.georaster, layer.bandIndex, layer.classCount, layer.rasterBandStats);
}

function updateRasterStatsUI(layer) {
  const stats = getCurrentBandStats(layer);
  const totalClassArea = layer.rasterClassStats.reduce((acc, item) => acc + item.areaKm2, 0);
  DOM.rasterPixelCount.textContent = stats?.count ? String(stats.count) : '0';
  DOM.rasterMin.textContent = formatMaybeNumber(stats?.min);
  DOM.rasterMax.textContent = formatMaybeNumber(stats?.max);
  DOM.rasterMean.textContent = formatMaybeNumber(stats?.mean);
  DOM.rasterCellArea.textContent = layer.georaster ? estimatePixelAreaKm2(layer.georaster).toFixed(6) : '-';
  DOM.rasterClassAreaTotal.textContent = layer.rasterClassStats.length ? totalClassArea.toFixed(4) : '-';
}

function updateRasterLegend(layer) {
  if (!layer.georaster || !layer.rasterClassStats.length) {
    DOM.rasterLegend.textContent = '未加载栅格';
    return;
  }
  DOM.rasterLegend.innerHTML = layer.rasterClassStats.map((item) => `
    <div class="legend-item"><span class="legend-color" style="background:${item.color}"></span><span>${escapeHTML(item.label)}</span></div>`).join('');
}

function renderRasterInfo(layer) {
  if (!layer.georaster) {
    DOM.rasterInfo.innerHTML = '<div class="empty-state compact-empty">加载 GeoTIFF 后显示范围、分辨率、波段等信息。</div>';
    return;
  }
  const georaster = layer.georaster;
  const bandCount = georaster.numberOfRasters || georaster.values.length;
  const stats = getCurrentBandStats(layer);
  DOM.rasterInfo.innerHTML = `
    <div class="raster-list">
      <div class="raster-item"><strong>文件</strong><div class="value-muted">${escapeHTML(layer.name)}</div></div>
      <div class="raster-item"><strong>尺寸</strong><div class="value-muted">${georaster.width} × ${georaster.height}</div></div>
      <div class="raster-item"><strong>波段数</strong><div class="value-muted">${bandCount}</div></div>
      <div class="raster-item"><strong>当前波段</strong><div class="value-muted">波段 ${layer.bandIndex + 1}</div></div>
      <div class="raster-item"><strong>范围</strong><div class="value-muted">xmin=${formatNumber(georaster.xmin, 6)}, ymin=${formatNumber(georaster.ymin, 6)}, xmax=${formatNumber(georaster.xmax, 6)}, ymax=${formatNumber(georaster.ymax, 6)}</div></div>
      <div class="raster-item"><strong>像元分辨率</strong><div class="value-muted">pixelWidth=${formatNumber(georaster.pixelWidth, 6)}, pixelHeight=${formatNumber(georaster.pixelHeight, 6)}</div></div>
      <div class="raster-item"><strong>投影</strong><div class="value-muted">${escapeHTML(projectionDisplay(georaster))}</div></div>
      <div class="raster-item"><strong>当前波段统计</strong><div class="value-muted">min=${formatMaybeNumber(stats?.min)}, max=${formatMaybeNumber(stats?.max)}, mean=${formatMaybeNumber(stats?.mean)}</div></div>
      <div class="status-pill">已按城市规划专题模式加载，可做多栅格对比</div>
    </div>`;
}

function renderRasterClassStats(layer) {
  if (!layer.rasterClassStats.length) {
    DOM.rasterClassStats.innerHTML = '<div class="empty-state compact-empty">加载栅格后自动计算分类面积统计。</div>';
    return;
  }
  const total = layer.rasterClassStats.reduce((acc, item) => acc + item.areaKm2, 0);
  const maxArea = Math.max(...layer.rasterClassStats.map((item) => item.areaKm2), 0.000001);
  DOM.rasterClassStats.innerHTML = `<div class="category-list">${layer.rasterClassStats.map((item) => `
    <div class="category-item">
      <div class="legend-item"><span class="legend-color" style="background:${item.color}"></span><strong>${escapeHTML(item.label)}</strong></div>
      <div class="value-muted">像元数：${item.count}</div>
      <div class="value-muted">面积：${item.areaKm2.toFixed(4)} km²</div>
      <div class="value-muted">占比：${total ? ((item.areaKm2 / total) * 100).toFixed(2) : '0.00'}%</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.areaKm2 / maxArea) * 100}%"></div></div>
    </div>`).join('')}</div>`;
}

function resetRasterStatsUI() {
  DOM.rasterPixelCount.textContent = '0';
  DOM.rasterMin.textContent = '-';
  DOM.rasterMax.textContent = '-';
  DOM.rasterMean.textContent = '-';
  DOM.rasterCellArea.textContent = '-';
  DOM.rasterClassAreaTotal.textContent = '-';
}

function fitToVisibleData() {
  try {
    const boundsList = [];
    getVectorLayers().forEach((layer) => {
      if (!layer.visible || !layer.leafletLayer) return;
      const bounds = layer.leafletLayer.getBounds();
      if (bounds.isValid()) boundsList.push(bounds);
    });
    getRasterLayers().forEach((layer) => {
      if (!layer.visible || !layer.rasterLayer) return;
      const bounds = layer.rasterLayer.getBounds();
      if (bounds.isValid()) boundsList.push(bounds);
    });
    if (!boundsList.length) return;
    const combined = boundsList[0];
    for (let i = 1; i < boundsList.length; i += 1) combined.extend(boundsList[i]);
    if (combined.isValid()) map.fitBounds(combined, { padding: [20, 20] });
  } catch (error) {
    console.warn('缩放到数据范围失败', error);
  }
}

function fitRasterBounds() {
  const layer = getActiveRasterLayer();
  if (!layer?.rasterLayer) return;
  try {
    const bounds = layer.rasterLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  } catch (error) {
    console.warn('缩放到栅格范围失败', error);
  }
}

function polygonLineStyle(feature, renderField, min, max, isActive, searchActive = false) {
  if (searchActive) return { color: '#b45309', weight: 2.4, fillColor: '#f97316', fillOpacity: isPolygon(feature) ? 0.72 : 0.95 };
  const color = isActive ? getFeatureColor(feature, renderField, min, max) : '#5b7db8';
  return { color: '#26384f', weight: 1.4, fillColor: color, fillOpacity: isPolygon(feature) ? 0.58 : 0.9 };
}
function pointStyle(feature, renderField, min, max, isActive, searchActive = false) {
  if (searchActive) return { radius: 8, color: '#7c2d12', weight: 2, fillColor: '#f97316', fillOpacity: 0.98 };
  return { radius: 6, color: '#1e293b', weight: 1, fillColor: isActive ? getFeatureColor(feature, renderField, min, max) : '#5b7db8', fillOpacity: 0.95 };
}
function getFeatureColor(feature, field, min, max) {
  if (!field) return '#2563eb';
  const value = Number(feature.properties?.[field]);
  if (!Number.isFinite(value)) return '#94a3b8';
  if (max === min) return '#2563eb';
  const ratio = clamp((value - min) / (max - min), 0, 1);
  const index = Math.min(COLOR_RAMP.length - 1, Math.floor(ratio * COLOR_RAMP.length));
  return COLOR_RAMP[index];
}

function buildPopupHTML(properties) {
  const activeFoodField = getFoodField();
  const isFoodFeature = properties && Object.prototype.hasOwnProperty.call(properties, activeFoodField);
  if (isFoodFeature) {
    const name = properties['小区'] || '未命名小区';
    const district = properties['行政区'] || '-';
    const address = properties['地址'] || '-';
    const currentValue = properties[activeFoodField];
    const mode = DOM.foodModeSelect?.value || '线上送餐';
    const meal = DOM.foodMealSelect?.value || '快餐';
    const metric = DOM.foodMetricSelect?.value || '可达性';
    const yearRows = ['2019', '2023', '2025'].map((year) => {
      const key = `${year}年${mode}${meal}${metric}`;
      return `<div class="popup-row"><strong>${year}年</strong><span>${formatMaybeNumber(Number(properties[key]))}</span></div>`;
    }).join('');
    return `<div class="popup-card">
      <div class="popup-title">${escapeHTML(name)}</div>
      <div class="popup-subtitle">${escapeHTML(district)} ｜ ${escapeHTML(address)}</div>
      <div class="popup-section-title">当前指标：${escapeHTML(getFoodLabel())}</div>
      <div class="popup-row highlight"><strong>当前值</strong><span>${formatMaybeNumber(Number(currentValue))}</span></div>
      <div class="popup-section-title">三期数值</div>
      ${yearRows}
      <div class="popup-section-title">基础属性</div>
      <div class="popup-row"><strong>均价</strong><span>${escapeHTML(properties['均价'] ?? '-')}</span></div>
      <div class="popup-row"><strong>物业费</strong><span>${escapeHTML(properties['物业费'] ?? '-')}</span></div>
      <div class="popup-row"><strong>建成时长</strong><span>${escapeHTML(properties['建成时长'] ?? '-')}</span></div>
      <div class="popup-row"><strong>距市中心</strong><span>${formatMaybeNumber(Number(properties['与市中心的距离']))}</span></div>
    </div>`;
  }
  const entries = Object.entries(properties).slice(0, 15);
  if (!entries.length) return '无属性信息';
  return `<div class="popup-grid">${entries.map(([key, value]) => `<div class="popup-row"><strong>${escapeHTML(key)}</strong>: ${escapeHTML(String(value))}</div>`).join('')}</div>`;
}

function renderSelectedCommunityCard(feature) {
  if (!DOM.selectedCommunityPanel) return;
  if (!feature?.properties) {
    DOM.selectedCommunityPanel.innerHTML = '点击地图上的小区点位后，这里会显示该小区在当前指标与三期时间截面下的数值。';
    return;
  }
  const props = feature.properties;
  const mode = DOM.foodModeSelect?.value || '线上送餐';
  const meal = DOM.foodMealSelect?.value || '快餐';
  const metric = DOM.foodMetricSelect?.value || '可达性';
  const currentField = getFoodField();
  const years = ['2019', '2023', '2025'];
  const rows = years.map((year) => {
    const key = `${year}年${mode}${meal}${metric}`;
    return `<div class="community-value-row ${key === currentField ? 'active' : ''}"><span>${year}年</span><strong>${formatMaybeNumber(Number(props[key]))}</strong></div>`;
  }).join('');
  DOM.selectedCommunityPanel.classList.remove('empty-state');
  DOM.selectedCommunityPanel.innerHTML = `
    <div class="selected-community-title">${escapeHTML(props['小区'] || '未命名小区')}</div>
    <div class="selected-community-meta">${escapeHTML(props['行政区'] || '-')} ｜ ${escapeHTML(props['地址'] || '-')}</div>
    <div class="selected-community-current">${escapeHTML(getFoodLabel())}：<strong>${formatMaybeNumber(Number(props[currentField]))}</strong></div>
    <div class="selected-community-values">${rows}</div>
    <div class="selected-community-grid">
      <div><span>均价</span><strong>${escapeHTML(props['均价'] ?? '-')}</strong></div>
      <div><span>物业费</span><strong>${escapeHTML(props['物业费'] ?? '-')}</strong></div>
      <div><span>建成时长</span><strong>${escapeHTML(props['建成时长'] ?? '-')}</strong></div>
      <div><span>距市中心</span><strong>${formatMaybeNumber(Number(props['与市中心的距离']))}</strong></div>
    </div>`;
}

function highlightFeature(layer, feature) {
  if (layer.selectedLayer) map.removeLayer(layer.selectedLayer);
  layer.selectedLayer = L.geoJSON(feature, {
    style: { color: '#ff8a00', weight: 3, fillColor: '#ffd08a', fillOpacity: 0.2 },
    pointToLayer: (_feature, latlng) => L.circleMarker(latlng, { radius: 8, color: '#ff8a00', weight: 2, fillColor: '#ffd08a', fillOpacity: 0.9 })
  });
  if (layer.visible && DOM.showHighlight.checked) layer.selectedLayer.addTo(map);
}


function clearChartGroup(keys) {
  keys.forEach((key) => {
    if (state.charts[key]) {
      state.charts[key].destroy();
      delete state.charts[key];
    }
  });
}

function renderChart(key, config) {
  if (typeof Chart === 'undefined') return;
  const canvas = DOM[key];
  if (!canvas) return;
  if (state.charts[key]) state.charts[key].destroy();
  const ctx = canvas.getContext('2d');
  state.charts[key] = new Chart(ctx, config);
}

function baseChartOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, labels: { boxWidth: 12, usePointStyle: true, color: '#41566f' } },
      tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.9)', padding: 10, titleColor: '#fff', bodyColor: '#fff' },
    },
    scales: {
      x: { ticks: { color: '#65798f', maxRotation: 0, autoSkip: true }, grid: { color: 'rgba(203, 213, 225, 0.35)' } },
      y: { ticks: { color: '#65798f' }, grid: { color: 'rgba(203, 213, 225, 0.35)' } },
    },
    ...extra,
  };
}

function renderVectorCharts(layer) {
  if (!layer?.currentGeoJSON?.features?.length) {
    clearChartGroup(['vectorCategoryChart', 'vectorTrendChart']);
    return;
  }
  renderVectorCategoryChart(layer);
  renderVectorTrendChart(layer);
}

function renderVectorCategoryChart(layer) {
  const field = DOM.categoryField.value;
  if (!field) {
    clearChartGroup(['vectorCategoryChart']);
    return;
  }
  const counter = new Map();
  layer.currentGeoJSON.features.forEach((feature) => {
    const key = String(feature.properties?.[field] ?? '未分类');
    counter.set(key, (counter.get(key) || 0) + 1);
  });
  const items = [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  if (!items.length) {
    clearChartGroup(['vectorCategoryChart']);
    return;
  }
  renderChart('vectorCategoryChart', {
    type: 'bar',
    data: {
      labels: items.map(([name]) => truncateLabel(name, 10)),
      datasets: [{ label: '要素数量', data: items.map(([, count]) => count), backgroundColor: '#5B8FF9', borderRadius: 6, maxBarThickness: 28 }],
    },
    options: baseChartOptions({ plugins: { legend: { display: false } } }),
  });
}

function renderVectorTrendChart(layer) {
  const field = DOM.renderField.value || layer.numericFields[0];
  if (!field) {
    clearChartGroup(['vectorTrendChart']);
    return;
  }
  const values = getNumericValues(layer.currentGeoJSON, field).sort((a, b) => a - b);
  if (!values.length) {
    clearChartGroup(['vectorTrendChart']);
    return;
  }
  const sampled = downsampleSeries(values, 60);
  renderChart('vectorTrendChart', {
    type: 'line',
    data: {
      labels: sampled.map((_, i) => `#${i + 1}`),
      datasets: [{ label: `${field} 数值趋势`, data: sampled, borderColor: '#36CFC9', backgroundColor: 'rgba(54, 207, 201, 0.18)', pointRadius: 0, borderWidth: 2.2, tension: 0.28, fill: true }],
    },
    options: baseChartOptions(),
  });
}

function renderRasterCharts(layer) {
  if (!layer?.georaster) {
    clearChartGroup(['rasterClassChart', 'rasterMultiChart']);
    return;
  }
  renderRasterClassChart(layer);
  renderRasterMultiChart();
}

function renderRasterClassChart(layer) {
  const classes = layer.rasterClassStats || [];
  if (!classes.length) {
    clearChartGroup(['rasterClassChart']);
    return;
  }
  renderChart('rasterClassChart', {
    type: 'bar',
    data: {
      labels: classes.map((item) => truncateLabel(item.label, 12)),
      datasets: [{ label: '面积 km²', data: classes.map((item) => Number(item.areaKm2.toFixed(4))), backgroundColor: classes.map((item) => item.color), borderRadius: 6, maxBarThickness: 26 }],
    },
    options: baseChartOptions({ plugins: { legend: { display: false } } }),
  });
}

function renderRasterMultiChart() {
  const layers = getRasterLayers();
  if (!layers.length) {
    clearChartGroup(['rasterMultiChart']);
    return;
  }
  const labels = layers.map((layer) => truncateLabel(layer.name, 12));
  const meanData = layers.map((layer) => getBandStats(layer, layer.bandIndex)?.mean ?? null);
  const minData = layers.map((layer) => getBandStats(layer, layer.bandIndex)?.min ?? null);
  const maxData = layers.map((layer) => getBandStats(layer, layer.bandIndex)?.max ?? null);
  renderChart('rasterMultiChart', {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: '均值', data: meanData, borderColor: '#5B8FF9', backgroundColor: 'rgba(91, 143, 249, 0.16)', tension: 0.28, fill: false },
        { label: '最小值', data: minData, borderColor: '#36CFC9', backgroundColor: 'rgba(54, 207, 201, 0.16)', tension: 0.28, fill: false },
        { label: '最大值', data: maxData, borderColor: '#F6BD16', backgroundColor: 'rgba(246, 189, 22, 0.16)', tension: 0.28, fill: false },
      ],
    },
    options: baseChartOptions(),
  });
}

function renderCompareCharts(result) {
  if (!result) {
    clearChartGroup(['compareMetricChart', 'compareDiffChart', 'compareTrendChart']);
    return;
  }
  renderChart('compareMetricChart', {
    type: 'bar',
    data: {
      labels: ['最小值', '平均值', '最大值'],
      datasets: [
        { label: '基准栅格', data: [result.baseMin, result.baseMean, result.baseMax].map((v) => v == null ? null : Number(v.toFixed(4))), backgroundColor: '#5B8FF9', borderRadius: 6, maxBarThickness: 30 },
        { label: '对比栅格', data: [result.targetMin, result.targetMean, result.targetMax].map((v) => v == null ? null : Number(v.toFixed(4))), backgroundColor: '#36CFC9', borderRadius: 6, maxBarThickness: 30 },
      ],
    },
    options: baseChartOptions(),
  });

  const hist = result.diffHistogram || [];
  if (hist.length) {
    renderChart('compareDiffChart', {
      type: 'bar',
      data: {
        labels: hist.map((item) => item.label),
        datasets: [{ label: '采样数', data: hist.map((item) => item.count), backgroundColor: '#7A9EFA', borderRadius: 4, maxBarThickness: 18 }],
      },
      options: baseChartOptions({ plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#65798f', maxRotation: 0, autoSkip: true }, grid: { display: false } }, y: { ticks: { color: '#65798f' }, grid: { color: 'rgba(203, 213, 225, 0.35)' } } } }),
    });
  } else {
    clearChartGroup(['compareDiffChart']);
  }

  const trend = result.diffTrend || [];
  if (trend.length) {
    renderChart('compareTrendChart', {
      type: 'line',
      data: {
        labels: trend.map((item) => item.label),
        datasets: [{ label: '平均差值趋势', data: trend.map((item) => Number(item.value.toFixed(4))), borderColor: '#F08BB4', backgroundColor: 'rgba(240, 139, 180, 0.14)', fill: true, pointRadius: 0, borderWidth: 2.2, tension: 0.3 }],
      },
      options: baseChartOptions(),
    });
  } else {
    clearChartGroup(['compareTrendChart']);
  }
}

function downsampleSeries(values, targetCount) {
  if (values.length <= targetCount) return values;
  const size = Math.ceil(values.length / targetCount);
  const sampled = [];
  for (let i = 0; i < values.length; i += size) {
    const chunk = values.slice(i, i + size);
    sampled.push(chunk.reduce((sum, value) => sum + value, 0) / chunk.length);
  }
  return sampled;
}

function truncateLabel(value, length = 12) {
  const text = String(value);
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function buildHistogram(values, binCount = 12) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: formatNumber(min), count: values.length, start: min, end: max }];
  const step = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    start: min + index * step,
    end: index === binCount - 1 ? max : min + (index + 1) * step,
    count: 0,
  }));
  values.forEach((value) => {
    const idx = classifyValue(value, min, max, binCount);
    bins[idx].count += 1;
  });
  return bins.map((bin) => ({ ...bin, label: `${formatNumber(bin.start, 2)}~${formatNumber(bin.end, 2)}` }));
}

function buildTrendSeries(values, bucketCount = 24) {
  if (!values.length) return [];
  const size = Math.max(1, Math.ceil(values.length / bucketCount));
  const list = [];
  for (let i = 0; i < values.length; i += size) {
    const chunk = values.slice(i, i + size);
    list.push({ label: `${list.length + 1}`, value: chunk.reduce((sum, value) => sum + value, 0) / chunk.length });
  }
  return list;
}

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((header, index) => { row[header] = values[index] ?? ''; });
    return row;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') { current += '"'; i += 1; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result;
}

function csvToGeoJSON(rows) {
  const lonKeys = ['lon', 'lng', 'longitude', 'x', '经度'];
  const latKeys = ['lat', 'latitude', 'y', '纬度'];
  const sample = rows[0] || {};
  const keys = Object.keys(sample);
  const lonKey = keys.find((key) => lonKeys.includes(key.toLowerCase()));
  const latKey = keys.find((key) => latKeys.includes(key.toLowerCase()));
  if (!lonKey || !latKey) throw new Error('CSV 未识别到经纬度字段，请确保包含 lon/lng/longitude/x 和 lat/latitude/y。');
  const features = rows.map((row) => {
    const lon = Number(row[lonKey]);
    const lat = Number(row[latKey]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    return { type: 'Feature', properties: row, geometry: { type: 'Point', coordinates: [lon, lat] } };
  }).filter(Boolean);
  if (!features.length) throw new Error('CSV 中没有可用的有效经纬度记录。');
  return { type: 'FeatureCollection', features };
}

function normalizeSpatialJSON(json) {
  if (json?.type === 'FeatureCollection' && Array.isArray(json.features)) return { geojson: json, sourceFormat: 'GeoJSON' };
  if (json?.type === 'Feature' && json.geometry) return { geojson: { type: 'FeatureCollection', features: [json] }, sourceFormat: 'GeoJSON 单要素' };
  if (json?.geometryType && Array.isArray(json.features)) return { geojson: arcgisJsonToGeoJSON(json), sourceFormat: `ArcGIS JSON (${json.geometryType})` };
  throw new Error('请上传合法的 GeoJSON FeatureCollection / Feature，或 ArcGIS JSON（含 geometryType + features）。');
}

function arcgisJsonToGeoJSON(data) {
  const geometryType = data.geometryType || '';
  const features = (data.features || []).map((item) => {
    const properties = item.attributes || {};
    const geometry = esriGeometryToGeoJSON(item.geometry, geometryType);
    return { type: 'Feature', properties, geometry };
  }).filter((feature) => feature.geometry);
  if (!features.length) throw new Error('ArcGIS JSON 中未发现可转换的有效几何对象。');
  return { type: 'FeatureCollection', features };
}

function esriGeometryToGeoJSON(geometry, geometryType) {
  if (!geometry) return null;
  if (geometryType === 'esriGeometryPoint') return Number.isFinite(geometry.x) && Number.isFinite(geometry.y) ? { type: 'Point', coordinates: [geometry.x, geometry.y] } : null;
  if (geometryType === 'esriGeometryMultipoint') return Array.isArray(geometry.points) ? { type: 'MultiPoint', coordinates: geometry.points } : null;
  if (geometryType === 'esriGeometryPolyline') {
    if (!Array.isArray(geometry.paths) || !geometry.paths.length) return null;
    return geometry.paths.length === 1 ? { type: 'LineString', coordinates: geometry.paths[0] } : { type: 'MultiLineString', coordinates: geometry.paths };
  }
  if (geometryType === 'esriGeometryPolygon') {
    if (!Array.isArray(geometry.rings) || !geometry.rings.length) return null;
    return convertEsriRingsToGeoJSONPolygon(geometry.rings);
  }
  return null;
}

function convertEsriRingsToGeoJSONPolygon(rings) {
  const outers = [];
  const holes = [];
  rings.forEach((ring) => {
    const normalized = ensureClosedRing(ring);
    const area = ringSignedArea(normalized);
    if (area < 0) outers.push([normalized]);
    else holes.push(normalized);
  });
  if (!outers.length) return { type: 'Polygon', coordinates: [ensureClosedRing(rings[0])] };
  holes.forEach((hole) => {
    const target = outers.findIndex((polygon) => pointInRing(hole[0], polygon[0]));
    if (target >= 0) outers[target].push(hole);
  });
  return outers.length === 1 ? { type: 'Polygon', coordinates: outers[0] } : { type: 'MultiPolygon', coordinates: outers.map((polygon) => [polygon[0], ...polygon.slice(1)]) };
}

function ensureClosedRing(ring) {
  if (!ring?.length) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}
function ringSignedArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum;
}
function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function extractFields(geojson) {
  if (!geojson?.features?.length) return [];
  const fieldSet = new Set();
  geojson.features.forEach((feature) => Object.keys(feature.properties || {}).forEach((field) => fieldSet.add(field)));
  return [...fieldSet];
}
function extractNumericFields(geojson) { return extractFields(geojson).filter((field) => geojson.features.some((feature) => Number.isFinite(Number(feature.properties?.[field])))); }
function getNumericValues(geojson, field) { return !field || !geojson?.features?.length ? [] : geojson.features.map((feature) => Number(feature.properties?.[field])).filter((value) => Number.isFinite(value)); }
function isPolygon(feature) { return (feature?.geometry?.type || '').includes('Polygon'); }

function computeRasterStats(georaster) {
  const stats = [];
  const bandCount = georaster.numberOfRasters || georaster.values.length;
  const noDataValues = Array.isArray(georaster.noDataValue) ? georaster.noDataValue : Array(bandCount).fill(georaster.noDataValue);
  for (let band = 0; band < bandCount; band += 1) {
    const rows = georaster.values[band] || [];
    const noDataValue = noDataValues[band];
    let min = Infinity, max = -Infinity, sum = 0, count = 0;
    for (let row = 0; row < rows.length; row += 1) {
      const rowValues = rows[row] || [];
      for (let col = 0; col < rowValues.length; col += 1) {
        const value = rowValues[col];
        if (!isValidRasterValue(value, noDataValue)) continue;
        if (value < min) min = value;
        if (value > max) max = value;
        sum += value;
        count += 1;
      }
    }
    stats.push({ band, min: count ? min : null, max: count ? max : null, mean: count ? sum / count : null, count, noDataValue });
  }
  return stats;
}

function computeRasterClassStats(georaster, bandIndex, classCount, rasterBandStats) {
  const bandRows = georaster.values?.[bandIndex] || [];
  const bandStats = rasterBandStats[bandIndex];
  if (!bandStats || !bandStats.count || bandStats.min == null || bandStats.max == null) return [];
  const min = bandStats.min;
  const max = bandStats.max;
  const noDataValue = bandStats.noDataValue;
  const cellAreaKm2 = estimatePixelAreaKm2(georaster);
  if (min === max) {
    return [{ index: 0, label: `${formatNumber(min)} ~ ${formatNumber(max)}`, min, max, count: bandStats.count, areaKm2: bandStats.count * cellAreaKm2, color: COLOR_RAMP[COLOR_RAMP.length - 2] }];
  }
  const classes = [];
  const step = (max - min) / classCount;
  for (let i = 0; i < classCount; i += 1) {
    const start = min + i * step;
    const end = i === classCount - 1 ? max : min + (i + 1) * step;
    classes.push({ index: i, min: start, max: end, count: 0, areaKm2: 0, color: COLOR_RAMP[Math.min(COLOR_RAMP.length - 1, Math.floor((i / Math.max(1, classCount - 1)) * (COLOR_RAMP.length - 1)))] });
  }
  for (let row = 0; row < bandRows.length; row += 1) {
    const rowValues = bandRows[row] || [];
    for (let col = 0; col < rowValues.length; col += 1) {
      const value = rowValues[col];
      if (!isValidRasterValue(value, noDataValue)) continue;
      const index = classifyValue(value, min, max, classCount);
      classes[index].count += 1;
      classes[index].areaKm2 += cellAreaKm2;
    }
  }
  return classes.map((item) => ({ ...item, label: `${formatNumber(item.min)} ~ ${formatNumber(item.max)}` }));
}

function getCurrentBandStats(layer) { return layer?.rasterBandStats?.[layer.bandIndex || 0] || null; }

function estimatePixelAreaKm2(georaster) {
  const pixelWidth = Math.abs(Number(georaster.pixelWidth || 0));
  const pixelHeight = Math.abs(Number(georaster.pixelHeight || 0));
  const centerLat = ((Number(georaster.ymin) || 0) + (Number(georaster.ymax) || 0)) / 2;
  if (!pixelWidth || !pixelHeight) return 0;
  if (isLikelyLonLatBounds(georaster) || String(georaster.projection || '').includes('4326') || String(georaster.projection || '').includes('4490')) {
    const metersPerDegLat = 111320;
    const metersPerDegLon = Math.cos((centerLat * Math.PI) / 180) * 111320;
    return (pixelWidth * metersPerDegLon * pixelHeight * metersPerDegLat) / 1_000_000;
  }
  return (pixelWidth * pixelHeight) / 1_000_000;
}

function classifyValue(value, min, max, classCount) {
  if (max === min) return 0;
  const ratio = clamp((value - min) / (max - min), 0, 0.999999999);
  return Math.min(classCount - 1, Math.floor(ratio * classCount));
}
function colorForRasterValue(value, stats, classStats) {
  if (!stats || !isValidRasterValue(value, stats.noDataValue)) return null;
  if (!classStats.length) return '#2563eb';
  const index = classifyValue(value, stats.min, stats.max, classStats.length);
  return classStats[index]?.color || '#2563eb';
}
function isValidRasterValue(value, noDataValue) {
  if (value == null || Number.isNaN(value)) return false;
  if (Array.isArray(noDataValue)) return !noDataValue.includes(value);
  if (noDataValue == null) return true;
  return value !== noDataValue;
}

function handleMapClick(event) {
  const visibleRasters = getRasterLayers().filter((layer) => layer.visible);
  if (!visibleRasters.length) return;
  const cards = visibleRasters.map((layer) => {
    const value = readRasterValueByCoord(layer, layer.bandIndex, event.latlng.lng, event.latlng.lat);
    if (value == null) return null;
    return `<div class="raster-item"><strong>${escapeHTML(layer.name)}</strong><div class="value-muted">波段 ${layer.bandIndex + 1}：${formatNumber(value, 6)}</div></div>`;
  }).filter(Boolean);
  if (!cards.length) {
    DOM.rasterClickInfo.innerHTML = '<div class="empty-state compact-empty">点击位置不在当前可见栅格范围内，或该位置为无效像元。</div>';
    return;
  }
  DOM.rasterClickInfo.innerHTML = `<div class="raster-list"><div class="raster-item"><strong>点击坐标</strong><div class="value-muted">lat=${formatNumber(event.latlng.lat, 6)}, lng=${formatNumber(event.latlng.lng, 6)}</div></div>${cards.join('')}</div>`;
}

function updateLastRasterClickInfo() {
  if (DOM.rasterClickInfo.innerHTML.trim()) return;
  DOM.rasterClickInfo.innerHTML = '<div class="empty-state compact-empty">点击地图获取当前波段像元值。</div>';
}

function readRasterValueByCoord(layer, bandIndex, lng, lat) {
  const georaster = layer?.georaster;
  if (!georaster) return null;
  if (lng < georaster.xmin || lng > georaster.xmax || lat < georaster.ymin || lat > georaster.ymax) return null;
  const pixelWidth = Math.abs(Number(georaster.pixelWidth));
  const pixelHeight = Math.abs(Number(georaster.pixelHeight));
  const col = Math.floor((lng - Number(georaster.xmin)) / pixelWidth);
  const row = Math.floor((Number(georaster.ymax) - lat) / pixelHeight);
  return readRasterValueByRowCol(layer, bandIndex, row, col);
}

function readRasterValueByRowCol(layer, bandIndex, row, col) {
  const georaster = layer?.georaster;
  if (!georaster) return null;
  if (row < 0 || col < 0 || row >= georaster.height || col >= georaster.width) return null;
  const rowValues = georaster.values?.[bandIndex]?.[row];
  if (!rowValues) return null;
  return rowValues[col];
}

function getCellCenter(georaster, row, col) {
  const lng = Number(georaster.xmin) + (col + 0.5) * Math.abs(Number(georaster.pixelWidth));
  const lat = Number(georaster.ymax) - (row + 0.5) * Math.abs(Number(georaster.pixelHeight));
  return { lng, lat };
}

function isIntegerLikeBand(layer, bandIndex) {
  const band = layer?.georaster?.values?.[bandIndex];
  if (!band) return false;
  let checked = 0;
  let integerLike = 0;
  const noData = getBandStats(layer, bandIndex)?.noDataValue;
  for (let row = 0; row < band.length && checked < 5000; row += Math.max(1, Math.floor(band.length / 80) || 1)) {
    const rowValues = band[row] || [];
    for (let col = 0; col < rowValues.length && checked < 5000; col += Math.max(1, Math.floor(rowValues.length / 80) || 1)) {
      const value = rowValues[col];
      if (!isValidRasterValue(value, noData)) continue;
      checked += 1;
      if (Math.abs(value - Math.round(value)) < 1e-6) integerLike += 1;
    }
  }
  return checked > 0 && integerLike / checked > 0.9;
}

function projectionDisplay(georaster) {
  if (georaster?.assumedProjectionName) return georaster.assumedProjectionName;
  const projection = String(georaster?.projection || '').toUpperCase();
  if (projection.includes('4490') || projection.includes('CGCS2000') || projection.includes('CGCS 2000') || isLikelyLonLatBounds(georaster || {})) return 'CGCS2000 / EPSG:4490（地理坐标系）';
  if (projection.includes('4326')) return 'WGS84 / EPSG:4326（地理坐标系）';
  return projection || '未知投影';
}

function updateRasterSliderLabels() {
  DOM.rasterOpacityLabel.textContent = Number(DOM.rasterOpacity.value).toFixed(2);
  DOM.classCountLabel.textContent = String(DOM.classCount.value);
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function formatMaybeNumber(value, digits = 4) { return value == null || Number.isNaN(value) ? '-' : formatNumber(value, digits); }
function formatNumber(value, digits = 4) { return !Number.isFinite(Number(value)) ? '-' : Number(value).toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1'); }
function formatPercent(value) { return `${(value * 100).toFixed(2)}%`; }
function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
