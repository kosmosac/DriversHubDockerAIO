import fs from "node:fs";

const deliveryPath = "src/routes/delivery.js";
let source = fs.readFileSync(deliveryPath, "utf8");

const oldName = '            const name = event.type === "job.started" ? tr("job_started") : event.type === "job.delivered" ? tr("job_delivered") : tr("coach_stop");';
const newName = `            const coachStops = dlogDetail.events.filter((item) => item.meta?.at_stop === true);
            const finalCoachStop = coachStops.length > 0 && coachStops[coachStops.length - 1] === event;
            const name = event.type === "job.started" ? tr("job_started") : event.type === "job.delivered" ? tr("job_delivered") : finalCoachStop ? tr("destination_stop") : tr("coach_stop");`;
const oldTimeline = "                                            {dlogDetail.events.map((e, idx) => {";
const newTimeline = '                                            {dlogDetail.events.filter((event) => !(dlogDetail.bus !== undefined && event.type === "job.delivered" && dlogDetail.events.some((item) => item.meta?.at_stop === true))).map((e, idx) => {';

if (source.includes(newTimeline) && source.includes('tr("destination_stop")')) {
    console.log("Coach arrival presentation is already present; no change needed.");
} else {
    if (!source.includes(oldName) || !source.includes(oldTimeline)) {
        throw new Error("Unsupported delivery event presentation implementation.");
    }
    source = source.replace(oldName, newName).replace(oldTimeline, newTimeline);
    fs.writeFileSync(deliveryPath, source);
}

const translations = {
    de: "Zielhaltestelle",
    en: "Destination Stop",
    es: "Parada de destino",
    nl: "Eindhalte",
    pt: "Paragem de destino",
};
for (const [language, label] of Object.entries(translations)) {
    const path = `src/languages/${language}.json`;
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    data.destination_stop = label;
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}
