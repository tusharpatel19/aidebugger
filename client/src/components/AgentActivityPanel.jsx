import { CheckCircle2, Circle, LoaderCircle, XCircle } from "lucide-react";

function iconFor(event, isLatest) {
  if (event.status === "failed") return <XCircle size={18} />;
  if (event.status === "completed") return <CheckCircle2 size={18} />;
  if (event.status === "started" && isLatest) return <LoaderCircle className="spin-icon" size={18} />;
  return <Circle size={18} />;
}

function AgentActivityPanel({ events = [], loading }) {
  const visibleEvents = loading && !events.length
    ? [{ agent: "workflow", status: "started", summary: "Starting agent workflow..." }]
    : events;

  return (
    <section className="panel activity-panel">
      <h2>Agent Activity</h2>
      <div className="activity-list">
        {visibleEvents.length ? (
          visibleEvents.map((event, index) => (
            <div key={`${event.agent}-${event.status}-${index}`} className={`activity-item ${event.status}`}>
              <span className="activity-icon">{iconFor(event, index === visibleEvents.length - 1 && loading)}</span>
              <div>
                <strong>{event.agent} Agent</strong>
                <p>{event.summary}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No activity yet.</p>
        )}
      </div>
    </section>
  );
}

export default AgentActivityPanel;
