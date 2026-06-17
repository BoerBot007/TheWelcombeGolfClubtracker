import React, { useState, useEffect } from "react";

const WEATHER_API_KEY = "9863438564424cde4eeccddc45cb53ec";
const STORAGE_KEY = "welcombe_scorecard";

const MAP_URL =
  "https://pgagbi.bluegolf.com/bluegolf/pgagbi11/event/pgagbi11364/course/menzieswelcombehotel/holemap.htm#";

// ✅ CLUB DISTANCES
const clubDistances = [
  { name: "Driver", distance: 230 },
  { name: "3-Wood", distance: 210 },
  { name: "Hybrid", distance: 195 },
  { name: "5 Iron", distance: 170 },
  { name: "6 Iron", distance: 160 },
  { name: "7 Iron", distance: 150 },
  { name: "8 Iron", distance: 140 },
  { name: "9 Iron", distance: 130 },
  { name: "PW", distance: 120 },
  { name: "GW", distance: 105 },
  { name: "SW", distance: 90 },
  { name: "LW", distance: 70 },
];

// ✅ HOLES
const holes = [
  { hole: 1, par: 5, white: 452, blue: 470, red: 437, dir: 180 },
  { hole: 2, par: 3, white: 146, blue: 170, red: 137, dir: 220 },
  { hole: 3, par: 4, white: 430, blue: 452, red: 403, dir: 90 },
  { hole: 4, par: 4, white: 373, blue: 388, red: 368, dir: 45 },
  { hole: 5, par: 4, white: 285, blue: 310, red: 270, dir: 270 },
  { hole: 6, par: 3, white: 141, blue: 177, red: 133, dir: 200 },
  { hole: 7, par: 4, white: 335, blue: 365, red: 321, dir: 140 },
  { hole: 8, par: 4, white: 373, blue: 402, red: 318, dir: 80 },
  { hole: 9, par: 3, white: 170, blue: 183, red: 165, dir: 30 },
  { hole: 10, par: 4, white: 331, blue: 371, red: 329, dir: 180 },
  { hole: 11, par: 3, white: 172, blue: 198, red: 169, dir: 210 },
  { hole: 12, par: 4, white: 361, blue: 374, red: 346, dir: 90 },
  { hole: 13, par: 4, white: 367, blue: 377, red: 360, dir: 60 },
  { hole: 14, par: 3, white: 156, blue: 171, red: 152, dir: 120 },
  { hole: 15, par: 4, white: 388, blue: 398, red: 377, dir: 300 },
  { hole: 16, par: 5, white: 496, blue: 509, red: 447, dir: 250 },
  { hole: 17, par: 4, white: 346, blue: 367, red: 336, dir: 200 },
  { hole: 18, par: 5, white: 479, blue: 496, red: 455, dir: 180 },
];

export default function App() {
  const [scores, setScores] = useState(Array(18).fill(0));
  const [tee, setTee] = useState("white");
  const [weather, setWeather] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [timeAgo, setTimeAgo] = useState("Not saved yet");

  // ✅ LOAD
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setScores(parsed);
        setLastSaved(Date.now());
      }
    }
  }, []);

  // ✅ SAVE
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    setLastSaved(Date.now());
  }, [scores]);

  // ✅ SAVE STATUS TIMER
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastSaved) return;

      const seconds = Math.floor((Date.now() - lastSaved) / 1000);

      if (seconds < 5) setTimeAgo("Saved just now");
      else if (seconds < 60) setTimeAgo(`Saved ${seconds} sec ago`);
      else setTimeAgo(`Saved ${Math.floor(seconds / 60)} min ago`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  // ✅ WEATHER
  useEffect(() => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=52.206&lon=-1.690&units=metric&appid=${WEATHER_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.main && data?.wind) {
          setWeather({
            temp: Math.round(data.main.temp),
            wind: Math.round(data.wind.speed),
            desc: data.weather[0].main,
            deg: data.wind.deg || 0,
          });
        }
      });
  }, []);

  const windArrow = (deg) => ({
    transform: `rotate(${(deg + 180) % 360}deg)`,
  });

  const compass = (deg) => {
    const d = (deg + 180) % 360;
    if (d >= 337.5 || d < 22.5) return "N";
    if (d < 67.5) return "NE";
    if (d < 112.5) return "E";
    if (d < 157.5) return "SE";
    if (d < 202.5) return "S";
    if (d < 247.5) return "SW";
    return "NW";
  };

  const windArrowHole = (w, h) => ({
    transform: `rotate(${((w + 180) % 360) - h}deg)`,
  });

  const windLabel = (w, h) => {
    const r = (((w + 180) % 360) - h + 360) % 360;
    if (r < 45 || r > 315) return "Helping";
    if (r > 135 && r < 225) return "Into";
    if (r >= 45 && r <= 135) return "Left → Right";
    return "Right → Left";
  };

  const getClub = (d) =>
    clubDistances.reduce((a, b) =>
      Math.abs(b.distance - d) < Math.abs(a.distance - d) ? b : a
    ).name;

  const strategy = (h) => {
    const d = h[tee];
    if (h.par === 3) return `Approach: ${getClub(d)}`;
    if (h.par === 4) return `Tee: Driver → ${getClub(d - 230)}`;
    return `Tee: Driver → Layup → Wedge`;
  };

  const total = scores.reduce((a, b) => a + b, 0);
  const front = scores.slice(0, 9).reduce((a, b) => a + b, 0);
  const back = scores.slice(9).reduce((a, b) => a + b, 0);

  const updateScore = (i, d) => {
    const s = [...scores];
    s[i] = Math.max(1, s[i] + d);
    setScores(s);
  };

  return (
    <div style={{ background: "#0b3d2e", color: "white", padding: 20 }}>
      <h1 style={{ textAlign: "center", color: "#d4af37" }}>Welcombe Golf</h1>

      <div style={{ textAlign: "center", marginBottom: 5 }}>
        Total: {total} | Front 9: {front} | Back 9: {back}
      </div>

      <div style={{ textAlign: "center", marginBottom: 10, fontSize: 12 }}>
        {timeAgo}
      </div>

      {weather && (
        <div style={{ textAlign: "center", marginBottom: 15 }}>
          {weather.desc} • {weather.temp}°C • Wind {weather.wind} m/s
          <span style={windArrow(weather.deg)}>↑</span> {compass(weather.deg)}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <select value={tee} onChange={(e) => setTee(e.target.value)}>
          <option value="white">White</option>
          <option value="blue">Blue</option>
          <option value="red">Red</option>
        </select>

        <a href={MAP_URL} target="_blank" rel="noopener noreferrer">
          <button>Map</button>
        </a>
      </div>

      {holes.map((h, i) => (
        <div
          key={i}
          style={{
            background: "#1f7a5c",
            padding: 14,
            marginBottom: 10,
            borderRadius: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>Hole {h.hole}</strong>
              <div>
                Par {h.par} • {h[tee]} yds
              </div>
            </div>

            {weather && (
              <div>
                <span style={windArrowHole(weather.deg, h.dir)}>↑</span>{" "}
                {windLabel(weather.deg, h.dir)}
              </div>
            )}
          </div>

          <div style={{ color: "#ffd966", marginTop: 6 }}>{strategy(h)}</div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <button onClick={() => updateScore(i, -1)}>-</button>
            {scores[i]}
            <button onClick={() => updateScore(i, 1)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}
