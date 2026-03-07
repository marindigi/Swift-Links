import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantize } from 'd3-scale';

// Using a standard world topojson URL
const GEO_URL = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

interface WorldMapProps {
  data: { name: string; value: number }[];
  theme: 'light' | 'dark';
}

export const WorldMap: React.FC<WorldMapProps> = ({ data, theme }) => {
  const colorScale = useMemo(() => {
    const max = Math.max(...data.map(d => d.value), 1);
    return scaleQuantize<string>()
      .domain([0, max])
      .range(theme === 'dark' ? ['#10b98120', '#10b98140', '#10b98160', '#10b98180', '#10b981'] : ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981']);
  }, [data, theme]);

  return (
    <div className="w-full h-64">
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }}>
        <ZoomableGroup center={[0, 20]}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryData = data.find(d => d.name === geo.properties.name);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={countryData ? colorScale(countryData.value) : (theme === 'dark' ? '#1f2937' : '#f3f4f6')}
                    stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#3b82f6" },
                      pressed: { outline: "none" }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};
