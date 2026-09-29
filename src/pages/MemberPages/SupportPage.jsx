import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import PageShell from "../../components/PageShell";
import SectionPanel from "../../components/SectionPanel";
import StatTile from "../../components/StatTile";
import SupportRequestPanel from "../../components/SupportRequestPanel";
import SupportRequestList from "../../components/SupportRequestList";
import { useAuth } from "../../contexts/AuthContext";
import {
  dbGetSupportCategories,
  dbGetSupportChannels,
  dbGetSupportContactMethods,
  dbGetSupportFaqs,
  dbGetSupportPriorities,
  dbGetSupportRequestsByUser,
  dbGetSupportStatus,
} from "../../services/mockDbServices";
import styles from "./SupportPage.module.css";

/** Maps support request states to the pill accents used in the recent request list. */
const statusClassNames = {
  "In review": styles.statusReview,
  "Waiting on member": styles.statusWaiting,
  Solved: styles.statusSolved,
  New: styles.statusNew,
};

/**
 * Finds the CSS module class for a support request status.
 *
 * @param {string} status Support request status.
 * @returns {string} Status accent class or an empty fallback.
 */
function getSupportStatusClassName(status) {
  return statusClassNames[status] || "";
}

/**
 * Renders the member support desk with request intake, status, and FAQ panels.
 * The route-level AppLayout supplies authenticated chrome for this page.
 * SupportPage owns data refreshes while SupportRequestList owns the activity rows.
 * Shared display primitives provide the page shell, metrics, and section panel surfaces.
 *
 * @returns {import("react").JSX.Element}
 */
function SupportPage() {
  // Hook: active member identity scopes support requests.
  const { user } = useAuth();
  // State: support contact options shown in the side panel.
  const [contactChannels, setContactChannels] = useState([]);
  // State: studio support status cards loaded from reference data.
  const [statusItems, setStatusItems] = useState([]);
  // State: FAQ entries shown in the support reference panel.
  const [faqItems, setFaqItems] = useState([]);
  // State: request categories passed to the support form.
  const [categories, setCategories] = useState([]);
  // State: member contact preferences passed to the support form.
  const [contactMethods, setContactMethods] = useState([]);
  // State: request priority options passed to the support form.
  const [priorities, setPriorities] = useState([]);
  // State: recent support requests for the signed-in member.
  const [requests, setRequests] = useState([]);

  // Static support reference data feeds both the request form and side panels.
  useEffect(() => {
    setContactChannels(dbGetSupportChannels());
    setStatusItems(dbGetSupportStatus());
    setFaqItems(dbGetSupportFaqs());
    setCategories(dbGetSupportCategories());
    setContactMethods(dbGetSupportContactMethods());
    setPriorities(dbGetSupportPriorities());
  }, []);

  // Callback: stable request refresh passed into the support request panel.
  /**
   * Reloads the signed-in member's support request activity.
   * @returns {void}
   */
  const refreshRequests = useCallback(() => {
    if (!user?.id) {
      setRequests([]);
      return;
    }

    setRequests(dbGetSupportRequestsByUser(user.id));
  }, [user?.id]);

  // Effect: refresh support activity whenever the signed-in member changes.
  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  // The queue card is editable reference data, so find it by label and fall back gracefully.
  const supportQueue = useMemo(
    () =>
      statusItems.find((item) =>
        String(item.label || "")
          .toLowerCase()
          .includes("queue")
      ) || statusItems[0],
    [statusItems]
  );

  // Memo: header metrics summarize the current support queue and request state.
  /**
   * Builds the compact support metrics shown in the page header.
   * @returns {Array<{ label: string, value: string | number }>}
   */
  const requestStats = useMemo(() => {
    const activeRequests = requests.filter(
      (request) => request.status !== "Solved"
    );

    return [
      { label: "Open requests", value: activeRequests.length },
      { label: "Latest update", value: requests[0]?.updated || "None" },
      { label: "Queue status", value: supportQueue?.value || "Loading" },
    ];
  }, [requests, supportQueue]);

  return (
    <PageShell className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Member support</p>
          <h1 className={styles.title}>Support desk</h1>
          <p className={styles.subtitle}>
            Service help for bookings, billing, vehicle notes, and detailing
            questions.
          </p>
        </div>

        <div className={styles.metrics} aria-label="Support summary">
          {requestStats.map((stat) => (
            <StatTile
              as="article"
              className={styles.metric}
              key={stat.label}
              label={stat.value}
              labelAs="strong"
              value={stat.label}
              valueAs="span"
            />
          ))}
        </div>
      </header>

      <div className={styles.contentGrid}>
        <SupportRequestPanel
          categories={categories}
          contactMethods={contactMethods}
          onRequestAdded={refreshRequests}
          priorities={priorities}
          styles={styles}
          supportQueue={supportQueue}
          userId={user?.id}
        />

        <aside className={styles.sideStack}>
          <SectionPanel className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Contact</p>
                <h2>Channels</h2>
              </div>
            </div>

            <div className={styles.channelList}>
              {contactChannels.map((channel) => (
                <Card
                  as="div"
                  className={styles.channelRow}
                  key={channel.title}
                  variant="custom"
                >
                  <div className={styles.channelDot} aria-hidden="true" />
                  <div className={styles.channelInfo}>
                    <strong>{channel.title}</strong>
                    <span>{channel.detail}</span>
                    <small>{channel.meta}</small>
                  </div>
                  <span className={styles.channelBadge}>{channel.badge}</span>
                </Card>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Status</p>
                <h2>Studio desk</h2>
              </div>
            </div>

            <div className={styles.statusList}>
              {statusItems.map((item) => (
                <Card
                  as="article"
                  className={styles.statusItem}
                  key={item.label}
                  variant="custom"
                >
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <p>{item.detail}</p>
                  <span
                    className={
                      item.state === "good"
                        ? `${styles.stateBar} ${styles.stateGood}`
                        : `${styles.stateBar} ${styles.stateWatch}`
                    }
                  />
                </Card>
              ))}
            </div>
          </SectionPanel>
        </aside>
      </div>

      <div className={styles.bottomGrid}>
        <SectionPanel className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Activity</p>
              <h2>Recent requests</h2>
            </div>
            <span className={styles.responseBadge}>{requests.length} total</span>
          </div>

          <SupportRequestList
            getStatusClassName={getSupportStatusClassName}
            requests={requests}
            styles={styles}
          />
        </SectionPanel>

        <SectionPanel className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Reference</p>
              <h2>FAQ</h2>
            </div>
          </div>

          <div className={styles.faqList}>
            {faqItems.map((item) => (
              <Card
                as="article"
                className={styles.faqItem}
                key={item.question}
                variant="custom"
              >
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </Card>
            ))}
          </div>
        </SectionPanel>
      </div>
    </PageShell>
  );
}

export default SupportPage;
