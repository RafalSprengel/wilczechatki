"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import type {
  AdminPaymentStatus,
  AdminPaymentsData,
  AdminPaymentTab,
} from "@/actions/adminPaymentActions";
import { syncOnlinePaymentAction } from "@/actions/adminPaymentActions";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

interface PaymentsPanelProps {
  initialData: AdminPaymentsData;
  mode: AdminPaymentTab;
}

function formatStatus(status: string): string {
  if (status === "confirmed") {
    return "Potwierdzone";
  }

  if (status === "failed") {
    return "Odrzucone (failed)";
  }

  return "Oczekujące (pending)";
}

function formatMethod(method: "online" | "cash" | "transfer"): string {
  if (method === "cash") {
    return "Gotówka";
  }

  if (method === "transfer") {
    return "Przelew";
  }

  return "Online";
}

function getActiveFilterClass(
  status: AdminPaymentStatus,
  styles: Record<string, string>,
): string {
  if (status === "confirmed") {
    return styles["payments-panel__filter-btn--active-confirmed"];
  }

  if (status === "failed") {
    return styles["payments-panel__filter-btn--active-failed"];
  }

  if (status === "all") {
    return styles["payments-panel__filter-btn--active-all"];
  }

  return styles["payments-panel__filter-btn--active-pending"];
}

export default function PaymentsPanel({
  initialData,
  mode,
}: PaymentsPanelProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] =
    useState<AdminPaymentStatus>("confirmed");
  const [orderSearch, setOrderSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Drag-to-scroll
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tableWrapRef.current && e.button === 0) {
      setIsDragging(true);
      dragStartX.current = e.pageX;
      scrollStartX.current = tableWrapRef.current.scrollLeft;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && tableWrapRef.current) {
      const dx = e.pageX - dragStartX.current;
      tableWrapRef.current.scrollLeft = scrollStartX.current - dx;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(orderSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  const rows = mode === "online" ? initialData.online : initialData.offline;

  const filteredRows = useMemo(() => {
    const rowsByMode =
      mode === "online"
        ? rows.filter((row) =>
            statusFilter === "all" ? true : row.status === statusFilter,
          )
        : rows;

    if (mode !== "online") {
      return rowsByMode;
    }

    const normalizedQuery = debouncedSearch.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return rowsByMode;
    }

    return rowsByMode.filter((row) => {
      const orderIdMatch =
        typeof row.orderId === "string" &&
        row.orderId.toLowerCase().includes(normalizedQuery);
      const guestNameMatch =
        typeof row.guestName === "string" &&
        row.guestName.toLowerCase().includes(normalizedQuery);

      return orderIdMatch || guestNameMatch;
    });
  }, [rows, statusFilter, mode, debouncedSearch]);

  const onSync = (bookingId: string) => {
    setSyncingId(bookingId);

    startTransition(async () => {
      const result = await syncOnlinePaymentAction(bookingId);

      if (result.level === "success") {
        toast.success(result.message);
      }

      if (result.level === "info") {
        toast(result.message);
      }

      if (result.level === "error") {
        toast.error(result.message);
      }

      setSyncingId(null);
      router.refresh();
    });
  };

  return (
    <section className={styles["payments-panel"]}>
      <h2 className={styles["payments-panel__title"]}>
        {mode === "online" ? "Płatności online" : "Gotówka / Przelew"}
      </h2>

      {mode === "online" ? (
        <div className={styles["payments-panel__filters-wrap"]}>
          <div
            className={styles["payments-panel__filters"]}
            role="radiogroup"
            aria-label="Filtr statusu"
          >
            <button
              type="button"
              role="radio"
              aria-checked={statusFilter === "confirmed"}
              className={`${styles["payments-panel__filter-btn"]} ${statusFilter === "confirmed" ? getActiveFilterClass("confirmed", styles) : ""}`}
              onClick={() => setStatusFilter("confirmed")}
            >
              Potwierdzone
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={statusFilter === "failed"}
              className={`${styles["payments-panel__filter-btn"]} ${statusFilter === "failed" ? getActiveFilterClass("failed", styles) : ""}`}
              onClick={() => setStatusFilter("failed")}
            >
              Odrzucone (failed)
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={statusFilter === "pending"}
              className={`${styles["payments-panel__filter-btn"]} ${statusFilter === "pending" ? getActiveFilterClass("pending", styles) : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              Oczekujące (pending)
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={statusFilter === "all"}
              className={`${styles["payments-panel__filter-btn"]} ${statusFilter === "all" ? getActiveFilterClass("all", styles) : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Wszystkie
            </button>
          </div>
          <div className={styles["payments-panel__search-wrap"]}>
            <label
              htmlFor="orderSearch"
              className={styles["payments-panel__search-label"]}
            >
              Szukaj zamówienia
            </label>
            <input
              id="orderSearch"
              type="text"
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Numer zamówienia lub dane gościa"
              className={styles["payments-panel__search-input"]}
            />
          </div>
        </div>
      ) : null}

      <div
        className={styles["payments-panel__table-wrap"]}
        ref={tableWrapRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <table className={styles["payments-panel__table"]}>
          <thead>
            <tr>
              {mode === "online" ? <th>Zamówienie nr</th> : null}
              <th>Data płatności</th>
              <th>Klient</th>
              <th>Kwota</th>
              {mode === "online" ? <th>Status</th> : <th>Metoda</th>}
              {mode === "online" ? <th>Sesja Stripe</th> : null}
              {mode === "online" ? <th>Akcja</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={mode === "online" ? 7 : 4}
                  className={styles["payments-panel__empty-row"]}
                >
                  Brak płatności dla wybranego filtra.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const createdAt = new Date(row.createdAt);
                const canSync = mode === "online" && row.status === "pending";

                return (
                  <tr key={row.id}>
                    {mode === "online" ? (
                      <td>{row.orderId ? row.orderId : "Brak numeru"}</td>
                    ) : null}
                    <td>{createdAt.toLocaleString("pl-PL")}</td>
                    <td>{row.guestName}</td>
                    <td>{row.totalPrice.toFixed(2)} zł</td>
                    {mode === "online" ? (
                      <td>{formatStatus(row.status)}</td>
                    ) : (
                      <td>{formatMethod(row.paymentMethod)}</td>
                    )}
                    {mode === "online" ? (
                      <td>
                        {typeof row.stripeSessionId === "string" &&
                        row.stripeSessionId.trim().length > 0 ? (
                          <a
                            href={`https://dashboard.stripe.com/checkout/sessions/${row.stripeSessionId}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles["payments-panel__session-link"]}
                          >
                            {row.stripeSessionId}
                          </a>
                        ) : (
                          <span
                            className={
                              styles["payments-panel__missing-session"]
                            }
                          >
                            Brak ID sesji
                          </span>
                        )}
                      </td>
                    ) : null}
                    {mode === "online" ? (
                      <td>
                        {canSync ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={isPending && syncingId === row.id}
                            onClick={() => onSync(row.id)}
                          >
                            {isPending && syncingId === row.id ? (
                              <span
                                className={
                                  styles["payments-panel__sync-loading"]
                                }
                              >
                                <span
                                  className={styles["payments-panel__spinner"]}
                                  aria-hidden="true"
                                ></span>
                                Loading...
                              </span>
                            ) : (
                              "Synchronizuj"
                            )}
                          </Button>
                        ) : (
                          <span className={styles["payments-panel__no-action"]}>
                            -
                          </span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
