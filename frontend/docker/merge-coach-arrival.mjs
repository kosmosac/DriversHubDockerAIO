import fs from "node:fs";

const deliveryPath = "src/routes/delivery.js";
let source = fs.readFileSync(deliveryPath, "utf8");

const oldName = '            const name = event.type === "job.started" ? tr("job_started") : event.type === "job.delivered" ? tr("job_delivered") : tr("coach_stop");';
const newName = `            const coachStops = dlogDetail.events.filter((item) => item.meta?.at_stop === true);
            const finalCoachStop = coachStops.length > 0 && coachStops[coachStops.length - 1] === event;
            const name = event.type === "job.started" ? tr("coach_departure") : event.type === "job.delivered" || finalCoachStop ? tr("coach_arrival") : tr("coach_stop");`;
const oldTimeline = "                                            {dlogDetail.events.map((e, idx) => {";
const newTimeline = '                                            {dlogDetail.events.filter((event) => !(dlogDetail.bus !== undefined && event.type === "job.delivered" && dlogDetail.events.some((item) => item.meta?.at_stop === true))).map((e, idx) => {';

if (source.includes(newTimeline) && source.includes('tr("coach_departure")') && source.includes('tr("coach_arrival")')) {
    console.log("Coach arrival presentation is already present; no change needed.");
} else {
    if (!source.includes(oldName) || !source.includes(oldTimeline)) {
        throw new Error("Unsupported delivery event presentation implementation.");
    }
    source = source.replace(oldName, newName).replace(oldTimeline, newTimeline);
    fs.writeFileSync(deliveryPath, source);
}

const translations = {
    de: { coach_departure: "Abfahrt", coach_stop: "Zwischenhalt", coach_arrival: "Ankunft" },
    en: { coach_departure: "Departure", coach_stop: "Intermediate Stop", coach_arrival: "Arrival" },
    es: { coach_departure: "Salida", coach_stop: "Parada intermedia", coach_arrival: "Llegada" },
    nl: { coach_departure: "Vertrek", coach_stop: "Tussenstop", coach_arrival: "Aankomst" },
    pt: { coach_departure: "Partida", coach_stop: "Paragem intermédia", coach_arrival: "Chegada" },
};
for (const [language, labels] of Object.entries(translations)) {
    const path = `src/languages/${language}.json`;
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    Object.assign(data, labels);
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}
