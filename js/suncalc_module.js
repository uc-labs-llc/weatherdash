// SunCalc v1.9.0 - Full Library Code
// Note: This is a full library file to make script1.js self-contained.
var SunCalc = (function () {

    // shortcuts for maths
    var PI = Math.PI,
        sin = Math.sin,
        cos = Math.cos,
        tan = Math.tan,
        asin = Math.asin,
        acos = Math.acos,
        atan = Math.atan2,
        rad = PI / 180;

    // date/time constants and conversions
    var dayMs = 1000 * 60 * 60 * 24,
        J1970 = 2440588,
        J2000 = 2451545;

    function toJulian(date) {
        return date.valueOf() / dayMs - 0.5 + J1970;
    }

    function fromJulian(j) {
        return new Date((j + 0.5 - J1970) * dayMs);
    }

    function toDays(date) {
        return toJulian(date) - J2000;
    }

    // general calculations for position
    var e = rad * 23.4397; // obliquity of the Earth's axis

    function rightAscension(l, b) {
        return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
    }

    function declination(l, b) {
        return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
    }

    function azimuth(H, phi, dec) {
        return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
    }

    function altitude(phi, dec, H) {
        return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
    }

    function siderealTime(d, lw) {
        return rad * (280.141 + 360.9856235 * d) - lw;
    }

    function astroRefraction(h) {
        if (h < 0) // the next three values are for h = -0.83 degrees
            return 0.5667 / (tan(h) + 0.165);
        else
            return 0;
    }

    // general sun calculations
    function solarMeanAnomaly(d) {
        return rad * (357.5291 + 0.98560028 * d);
    }

    function eclipticLongitude(M) {
        var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
            P = rad * 102.9372; // perihelion argument

        return M + C + P + PI;
    }

    function sunCoords(d) {
        var M = solarMeanAnomaly(d),
            L = eclipticLongitude(M);

        return {
            dec: declination(L, 0),
            ra: rightAscension(L, 0)
        };
    }

    var SunCalc = {};

    // calculates sun position for a given date and latitude/longitude
    SunCalc.getPosition = function (date, lat, lon) {

        var lw = rad * -lon,
            phi = rad * lat,
            d = toDays(date),

            c = sunCoords(d),
            H = siderealTime(d, lw) - c.ra;

        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: altitude(phi, c.dec, H)
        };
    };

    // sun times configuration (angle, morning name, evening name)
    var times = SunCalc.times = [
        [-0.833, 'sunrise', 'sunset'],
        [-0.3, 'sunriseEnd', 'sunsetStart'],
        [-6, 'dawn', 'dusk'],
        [-12, 'nauticalDawn', 'nauticalDusk'],
        [-18, 'nightEnd', 'night'],
        [6, 'goldenHourEnd', 'goldenHour']
    ];

    // adds a custom time to the times config
    SunCalc.addTime = function (angle, riseName, setName) {
        SunCalc.times.push([angle, riseName, setName]);
    };

    // calculations for sun times
    var J0 = 0.0009;

    function julianCycle(d, lw) {
        return Math.round(d - J0 - lw / (2 * PI));
    }

    function approxTransit(Ht, lw, n) {
        return J0 + (Ht + lw) / (2 * PI) + n;
    }

    function solarTransit(ds, M, L) {
        return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
    }

    function hourAngle(h, phi, dec) {
        return acos((sin(h) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec)));
    }

    function set-rise(h, lw, phi, dec, n, M, L) {
        var H = hourAngle(h, phi, dec),
            dss = approxTransit(H, lw, n),
            rs = solarTransit(dss, M, L);

        return fromJulian(rs);
    }

    // calculates sun times for a given date and latitude/longitude
    SunCalc.getTimes = function (date, lat, lon) {

        var lw = rad * -lon,
            phi = rad * lat,
            d = toDays(date),
            n = julianCycle(d, lw),
            ds = approxTransit(0, lw, n),
            M = solarMeanAnomaly(ds),
            L = eclipticLongitude(M),
            dec = sunCoords(ds).dec,

            Jtransit = solarTransit(ds, M, L),
            result = {
                solarNoon: fromJulian(Jtransit),
                nadir: fromJulian(Jtransit - 0.5)
            };

        for (var i = 0, len = times.length; i < len; i += 1) {
            var time = times[i],
                h0 = time[0] * rad,
                Jset = set-rise(h0, lw, phi, dec, n, M, L),
                Jrise = set-rise(h0, lw, phi, dec, n - 1, M, L);

            if (Jset.valueOf() > Jrise.valueOf()) {
                result[time[1]] = Jrise;
                result[time[2]] = Jset;
            } else {
                result[time[1]] = Jset;
                result[time[2]] = Jrise;
            }
        }

        return result;
    };

    // moon calculations, based on http://aa.quae.nl/en/reken/maanpositie.html formulas

    function moonCoords(d) { // geocentric ecliptic coordinates of the moon

        var L0 = rad * (218.316 + 13.176396 * d), // ecliptic longitude
            M = rad * (134.963 + 13.064993 * d), // mean anomaly
            F = rad * (93.272 + 13.229350 * d), // mean distance

            l = L0 + rad * 6.289 * sin(M), // longitude
            b = rad * 5.128 * sin(F), // latitude
            dt = 384400 / 6371; // distance to the Earth in units of Earth radii

        return {
            ra: rightAscension(l, b),
            dec: declination(l, b),
            dist: dt
        };
    }

    SunCalc.getMoonPosition = function (date, lat, lon) {

        var lw = rad * -lon,
            phi = rad * lat,
            d = toDays(date),

            c = moonCoords(d),
            H = siderealTime(d, lw) - c.ra,
            h = altitude(phi, c.dec, H),
            // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus
            pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

        h = h + astroRefraction(h); // daily refraction correction

        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: h,
            distance: c.dist,
            parallacticAngle: pa
        };
    };

    // calculations for illumination parameters of the moon,
    // based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
    // Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus

    SunCalc.getMoonIllumination = function (date) {

        var d = toDays(date),
            s = sunCoords(d),
            m = moonCoords(d),

            sdist = 149598000, // distance from Earth to Sun in km

            phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
            inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)),
            angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

        return {
            fraction: (1 + cos(inc)) / 2,
            phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
            angle: angle
        };
    };

    function hoursLater(date, h) {
        return new Date(date.valueOf() + h * dayMs / 24);
    }

    // calculations for moon rise/set
    SunCalc.getMoonTimes = function (date, lat, lon, height) {
        var hc = 0.133 * rad,
            h0 = SunCalc.getMoonPosition(date, lat, lon).altitude - hc,
            y = lat / 180 * PI,
            sradius = 0.25 * rad,
            isSet = false;

        // get current moon position and angle
        var pos = SunCalc.getMoonPosition(date, lat, lon),
            angle = pos.altitude;

        // loop to find rise and set times
        var step = 0.5, // 30 minutes step
            moonTimes = {
                rise: null,
                set: null,
                alwaysUp: false,
                alwaysDown: false
            };

        // this function checks if the moon crosses the horizon
        function setMoon(hour) {
            var h = SunCalc.getMoonPosition(hoursLater(date, hour), lat, lon).altitude - hc;
            if (h * angle < 0) {
                // hour angle has changed sign, we have a crossing
                var root = findRoot(setMoon, hour, step);
                if (h > 0) moonTimes.rise = hoursLater(date, root);
                else moonTimes.set = hoursLater(date, root);
                isSet = true;
            }
            angle = h;
            return h;
        }

        function findRoot(f, x0, dx) {
            var x1 = x0 - dx,
                y0 = f(x0),
                y1 = f(x1);

            if (y0 * y1 < 0) {
                // a root exists between x1 and x0
                var iterations = 0;
                while (iterations < 10 && Math.abs(x1 - x0) > 0.0001) {
                    var x2 = (x0 + x1) / 2,
                        y2 = f(x2);
                    if (y2 * y0 < 0) x1 = x2;
                    else x0 = x2;
                    iterations++;
                }
                return x2;
            }
            return x0;
        }

        // loop through 24 hours to find rise/set
        for (var i = 1; i <= 24 / step; i += 1) {
            setMoon(i * step);
        }

        // always up or always down?
        if (!isSet && angle > 0) moonTimes.alwaysUp = true;
        if (!isSet && angle < 0) moonTimes.alwaysDown = true;

        return moonTimes;
    };


    return SunCalc;

})();

