// Official vector polygon paths for the 17 Barangays of San Luis, Pampanga
// Coordinate space: ViewBox 0 0 480 356

export interface BarangayPolygonPath {
  id: number;
  name: string;
  shortName: string;
  centroidX: number;
  centroidY: number;
  pctX: number;
  pctY: number;
  d: string;
}

export const SAN_LUIS_POLYGONS: BarangayPolygonPath[] = [
  {
    "id": 1,
    "name": "Sto. Rosario",
    "shortName": "Sto. Rosario",
    "centroidX": 151,
    "centroidY": 79,
    "pctX": 31.45,
    "pctY": 22.23,
    "d": "M 161 14 L 170 15 L 184 34 L 166 91 L 168 131 L 141 148 L 114 64 L 118 61 L 127 60 L 138 52 L 161 14 Z"
  },
  {
    "id": 2,
    "name": "Sta. Catalina",
    "shortName": "Sta. Catalina",
    "centroidX": 186,
    "centroidY": 89,
    "pctX": 38.66,
    "pctY": 24.89,
    "d": "M 185 35 L 200 54 L 202 89 L 206 106 L 190 116 L 184 122 L 181 128 L 183 142 L 170 131 L 168 91 L 185 35 Z"
  },
  {
    "id": 3,
    "name": "Sta. Cruz Pambilog",
    "shortName": "Pambilog",
    "centroidX": 215,
    "centroidY": 87,
    "pctX": 44.72,
    "pctY": 24.35,
    "d": "M 202 57 L 206 68 L 239 97 L 221 96 L 213 102 L 209 104 L 207 103 L 204 89 L 202 57 Z"
  },
  {
    "id": 4,
    "name": "Sto. Tomas",
    "shortName": "Sto. Tomas",
    "centroidX": 125,
    "centroidY": 137,
    "pctX": 26.08,
    "pctY": 38.35,
    "d": "M 113 66 L 139 148 L 154 165 L 153 173 L 146 182 L 143 181 L 139 186 L 139 202 L 133 200 L 99 89 L 106 81 L 113 66 Z"
  },
  {
    "id": 5,
    "name": "Sta. Lucia",
    "shortName": "Sta. Lucia",
    "centroidX": 92,
    "centroidY": 112,
    "pctX": 19.26,
    "pctY": 31.52,
    "d": "M 97 89 L 110 131 L 89 136 L 85 119 L 76 105 L 76 99 L 73 94 L 90 93 L 97 89 Z"
  },
  {
    "id": 6,
    "name": "San Juan",
    "shortName": "San Juan",
    "centroidX": 243,
    "centroidY": 144,
    "pctX": 50.6,
    "pctY": 40.49,
    "d": "M 221 98 L 240 99 L 243 104 L 244 113 L 247 120 L 255 129 L 259 131 L 270 132 L 287 127 L 290 127 L 292 130 L 294 135 L 292 145 L 294 175 L 285 195 L 187 145 L 183 135 L 183 128 L 186 122 L 221 98 Z"
  },
  {
    "id": 7,
    "name": "San Sebastian",
    "shortName": "San Sebastian",
    "centroidX": 167,
    "centroidY": 152,
    "pctX": 34.71,
    "pctY": 42.71,
    "d": "M 169 132 L 184 144 L 189 152 L 188 157 L 172 163 L 167 168 L 166 173 L 169 179 L 142 150 L 169 132 Z"
  },
  {
    "id": 8,
    "name": "Sta. Rita",
    "shortName": "Sta. Rita",
    "centroidX": 104,
    "centroidY": 179,
    "pctX": 21.63,
    "pctY": 50.17,
    "d": "M 109 133 L 111 134 L 132 201 L 125 201 L 118 207 L 115 218 L 117 230 L 97 224 L 95 221 L 77 141 L 84 141 L 91 137 L 109 133 Z"
  },
  {
    "id": 9,
    "name": "San Carlos",
    "shortName": "San Carlos",
    "centroidX": 56,
    "centroidY": 186,
    "pctX": 11.59,
    "pctY": 52.28,
    "d": "M 70 139 L 75 140 L 76 142 L 94 223 L 85 221 L 62 211 L 41 211 L 28 206 L 19 206 L 24 194 L 20 163 L 23 154 L 31 150 L 34 152 L 41 164 L 52 175 L 66 181 L 71 181 L 73 175 L 65 162 L 66 148 L 70 139 Z"
  },
  {
    "id": 10,
    "name": "San Nicolas",
    "shortName": "San Nicolas",
    "centroidX": 211,
    "centroidY": 187,
    "pctX": 43.87,
    "pctY": 52.56,
    "d": "M 189 148 L 253 181 L 224 233 L 171 181 L 168 173 L 169 168 L 174 164 L 188 159 L 191 155 L 189 148 Z"
  },
  {
    "id": 11,
    "name": "Sta. Cruz Poblacion",
    "shortName": "Poblacion",
    "centroidX": 159,
    "centroidY": 180,
    "pctX": 33.05,
    "pctY": 50.63,
    "d": "M 156 167 L 169 181 L 168 186 L 163 189 L 147 183 L 155 174 L 156 167 Z"
  },
  {
    "id": 12,
    "name": "San Isidro",
    "shortName": "San Isidro",
    "centroidX": 255,
    "centroidY": 269,
    "pctX": 53.02,
    "pctY": 75.62,
    "d": "M 254 182 L 284 197 L 279 204 L 278 217 L 283 223 L 292 226 L 300 244 L 292 260 L 293 339 L 287 339 L 274 333 L 254 335 L 244 334 L 237 331 L 232 326 L 210 312 L 208 299 L 205 293 L 197 288 L 224 235 L 254 182 Z"
  },
  {
    "id": 13,
    "name": "Sta. Monica",
    "shortName": "Sta. Monica",
    "centroidX": 183,
    "centroidY": 220,
    "pctX": 38.16,
    "pctY": 61.91,
    "d": "M 143 183 L 160 191 L 168 188 L 171 183 L 223 234 L 207 266 L 142 202 L 141 186 L 143 183 Z"
  },
  {
    "id": 14,
    "name": "San Agustin",
    "shortName": "San Agustin",
    "centroidX": 160,
    "centroidY": 240,
    "pctX": 33.36,
    "pctY": 67.47,
    "d": "M 125 203 L 141 203 L 206 268 L 196 287 L 168 264 L 159 254 L 152 242 L 145 236 L 141 234 L 122 232 L 119 230 L 119 224 L 117 221 L 118 212 L 120 207 L 125 203 Z"
  },
  {
    "id": 15,
    "name": "San Roque",
    "shortName": "San Roque",
    "centroidX": 306,
    "centroidY": 293,
    "pctX": 63.72,
    "pctY": 82.42,
    "d": "M 300 249 L 300 264 L 302 271 L 305 274 L 312 269 L 316 270 L 323 277 L 327 292 L 311 309 L 311 313 L 304 328 L 295 338 L 294 260 L 300 249 Z"
  },
  {
    "id": 16,
    "name": "San Jose",
    "shortName": "San Jose",
    "centroidX": 397,
    "centroidY": 298,
    "pctX": 82.7,
    "pctY": 83.62,
    "d": "M 411 255 L 419 256 L 422 261 L 419 280 L 422 282 L 440 281 L 447 295 L 453 299 L 452 314 L 455 320 L 381 320 L 380 328 L 374 328 L 347 321 L 339 315 L 338 312 L 350 282 L 362 283 L 374 276 L 383 281 L 387 280 L 397 264 L 403 258 L 411 255 Z"
  },
  {
    "id": 17,
    "name": "Sto. Niño",
    "shortName": "Sto. Niño",
    "centroidX": 335,
    "centroidY": 293,
    "pctX": 69.75,
    "pctY": 82.29,
    "d": "M 325 279 L 349 281 L 337 311 L 326 304 L 320 303 L 329 292 L 325 279 Z"
  }
];
