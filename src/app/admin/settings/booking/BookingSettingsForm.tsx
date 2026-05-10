'use client';
import { useActionState, useEffect, useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { updateBookingConfig, updateAllowCheckinOnDepartureDay } from '@/actions/bookingConfigActions';
import { createSeason, deleteSeason, getAllSeasons, updateSeasonDates, updateSeasonOrder, ISeasonData } from '@/actions/seasonActions';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import Modal from '@/app/_components/Modal/Modal';
import styles from './booking.module.css';

interface BookingConfig {
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart: string | null;
  highSeasonEnd: string | null;
  childrenFreeAgeLimit: number;
  allowCheckinOnDepartureDay: boolean;
  checkInHour: number;
  checkOutHour: number;
}

interface Props {
  initialConfig: BookingConfig;
}

const MONTH_OPTIONS = [
  { value: 1, label: 'Styczeń' },
  { value: 2, label: 'Luty' },
  { value: 3, label: 'Marzec' },
  { value: 4, label: 'Kwiecień' },
  { value: 5, label: 'Maj' },
  { value: 6, label: 'Czerwiec' },
  { value: 7, label: 'Lipiec' },
  { value: 8, label: 'Sierpień' },
  { value: 9, label: 'Wrzesień' },
  { value: 10, label: 'Październik' },
  { value: 11, label: 'Listopad' },
  { value: 12, label: 'Grudzień' },
];

function getMaxDaysInMonth(month: number): number {
  if (month === 2) return 29;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function toIsoDate(month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `2000-${mm}-${dd}`;
}

export default function BookingSettingsForm({ initialConfig }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateBookingConfig, {
    message: '',
    success: false,
  });

  const [localMinDays, setLocalMinDays] = useState<number | "">(initialConfig.minBookingDays);
  const [localMaxDays, setLocalMaxDays] = useState<number | "">(initialConfig.maxBookingDays);
  const [localChildrenFreeAge, setLocalChildrenFreeAge] = useState<number | "">(initialConfig.childrenFreeAgeLimit);
  const [localCheckInHour, setLocalCheckInHour] = useState<number | "">(initialConfig.checkInHour);
  const [localCheckOutHour, setLocalCheckOutHour] = useState<number | "">(initialConfig.checkOutHour);
  const [allowCheckin, setAllowCheckin] = useState(initialConfig.allowCheckinOnDepartureDay);

  const [togglePending, startToggleTransition] = useTransition();
  const [seasons, setSeasons] = useState<ISeasonData[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<ISeasonData | null>(null);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);
  const [isUpdatingSeason, setIsUpdatingSeason] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonDesc, setSeasonDesc] = useState('');
  const [seasonStartDay, setSeasonStartDay] = useState(1);
  const [seasonStartMonth, setSeasonStartMonth] = useState(1);
  const [seasonEndDay, setSeasonEndDay] = useState(1);
  const [seasonEndMonth, setSeasonEndMonth] = useState(1);
  const [seasonOrder, setSeasonOrder] = useState<number>(0);
  const [isEditExpanded, setIsEditExpanded] = useState(false);
  const [isAddExpanded, setIsAddExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingSeason, setIsDeletingSeason] = useState(false);
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonDesc, setNewSeasonDesc] = useState('');
  const [newSeasonOrder, setNewSeasonOrder] = useState('');
  const [seasonDateErrors, setSeasonDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const isConfigDirty = useMemo(() => {
    return (
      localMinDays !== initialConfig.minBookingDays ||
      localMaxDays !== initialConfig.maxBookingDays ||
      localChildrenFreeAge !== initialConfig.childrenFreeAgeLimit ||
      localCheckInHour !== initialConfig.checkInHour ||
      localCheckOutHour !== initialConfig.checkOutHour
    );
  }, [localMinDays, localMaxDays, localChildrenFreeAge, localCheckInHour, localCheckOutHour, initialConfig]);

  const isSeasonDirty = useMemo(() => {
    if (!selectedSeason) return false;
    const originalStart = dayjs(selectedSeason.startDate);
    const originalEnd = dayjs(selectedSeason.endDate);

    return (
      seasonName !== selectedSeason.name ||
      seasonDesc !== (selectedSeason.description || '') ||
      seasonStartDay !== originalStart.date() ||
      seasonStartMonth !== originalStart.month() + 1 ||
      seasonEndDay !== originalEnd.date() ||
      seasonEndMonth !== originalEnd.month() + 1 ||
      seasonOrder !== selectedSeason.order
    );
  }, [selectedSeason, seasonName, seasonDesc, seasonStartDay, seasonStartMonth, seasonEndDay, seasonEndMonth, seasonOrder]);

  const isAnyDirty = isConfigDirty || isSeasonDirty;

  useEffect(() => {
    const loadSeasons = async () => {
      setIsLoadingSeasons(true);
      const seasonsList = await getAllSeasons();
      setSeasons(seasonsList);
      setIsLoadingSeasons(false);
    };
    loadSeasons();
  }, []);

  useEffect(() => {
    if (!selectedSeasonId && seasons.length > 0) {
      setSelectedSeasonId(seasons[0]._id);
      return;
    }
    const season = seasons.find(s => s._id === selectedSeasonId);
    setSelectedSeason(season || null);
    if (season) {
      setSeasonDateErrors({});
      setSeasonName(season.name);
      setSeasonDesc(season.description || '');
      const start = dayjs(season.startDate);
      const end = dayjs(season.endDate);
      setSeasonStartDay(start.date());
      setSeasonStartMonth(start.month() + 1);
      setSeasonEndDay(end.date());
      setSeasonEndMonth(end.month() + 1);
      setSeasonOrder(season.order);
    }
  }, [selectedSeasonId, seasons]);

  useEffect(() => {
    setAllowCheckin(initialConfig.allowCheckinOnDepartureDay);
  }, [initialConfig.allowCheckinOnDepartureDay]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleUpdateSeasonSilent = async () => {
    if (!seasonName || !selectedSeasonId) return false;
    if (!isSeasonDirty) return true;

    setSeasonDateErrors({});

    const startDateToSave = toIsoDate(seasonStartMonth, seasonStartDay);
    const endDateToSave = toIsoDate(seasonEndMonth, seasonEndDay);

    setIsUpdatingSeason(true);
    try {
      if (seasonOrder !== selectedSeason?.order) {
        await updateSeasonOrder(selectedSeasonId, seasonOrder);
      }
      const result = await updateSeasonDates(
        seasonName,
        seasonDesc,
        selectedSeasonId,
        startDateToSave,
        endDateToSave
      );

      if (result.success) {
        const updatedSeasons = await getAllSeasons();
        setSeasons(updatedSeasons);
        setSeasonDateErrors({});
        toast.success(`Zapisano zmiany w sezonie: ${seasonName}`);
        setIsEditExpanded(false);
        return true;
      } else {
        const messageLower = result.message.toLowerCase();
        const isDateRangeConflict = messageLower.includes('nakłada') || messageLower.includes('naklada');
        if (isDateRangeConflict) {
          setSeasonDateErrors({
            startDate: result.message,
            endDate: result.message,
          });
        }
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      toast.error('Wystąpił błąd podczas automatycznego zapisu');
      return false;
    } finally {
      setIsUpdatingSeason(false);
    }
  };

  const handleSeasonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    if (isSeasonDirty) {
      const saved = await handleUpdateSeasonSilent();
      if (!saved) return;
    }
    setSelectedSeasonId(nextId);
  };

  const handleToggle = () => {
    const newValue = !allowCheckin;
    startToggleTransition(async () => {
      const result = await updateAllowCheckinOnDepartureDay(newValue);
      if (result.success) {
        setAllowCheckin(newValue);
        toast.success(result.message);
      } else {
        toast.error(result.message || 'Błąd zapisu');
      }
    });
  };

  const resetAddSeasonForm = () => {
    setNewSeasonName('');
    setNewSeasonDesc('');
    setNewSeasonOrder('');
  };

  const handleToggleAddSeason = () => {
    if (isAddExpanded) {
      setIsAddExpanded(false);
      return;
    }
    resetAddSeasonForm();
    setIsAddExpanded(true);
  };

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) {
      toast.error('Nazwa sezonu jest wymagana');
      return;
    }

    if (newSeasonOrder.trim() === '') {
      toast.error('Kolejność jest wymagana');
      return;
    }

    const parsedOrder = parseInt(newSeasonOrder, 10);
    if (Number.isNaN(parsedOrder)) {
      toast.error('Kolejność musi być liczbą');
      return;
    }

    setIsCreatingSeason(true);
    try {
      const result = await createSeason(newSeasonName, newSeasonDesc, parsedOrder);
      if (!result.success) {
        toast.error(result.message || 'Nie udało się dodać sezonu');
        return;
      }

      const updatedSeasons = await getAllSeasons();
      setSeasons(updatedSeasons);
      if (result.seasonId) {
        setSelectedSeasonId(result.seasonId);
      }
      setIsAddExpanded(false);
      toast.success(result.message);
    } catch (error) {
      toast.error('Wystąpił błąd podczas dodawania sezonu');
    } finally {
      setIsCreatingSeason(false);
    }
  };

  const handleDeleteSeasonConfirm = async () => {
    if (!selectedSeasonId) return;

    setIsDeletingSeason(true);
    try {
      const result = await deleteSeason(selectedSeasonId);
      if (!result.success) {
        toast.error(result.message || 'Nie udało się usunąć sezonu');
        return;
      }

      const updatedSeasons = await getAllSeasons();
      setSeasons(updatedSeasons);
      setSelectedSeasonId(updatedSeasons[0]?._id || '');
      setIsDeleteModalOpen(false);
      setIsEditExpanded(false);
      toast.success(result.message);
    } catch (error) {
      toast.error('Wystąpił błąd podczas usuwania sezonu');
    } finally {
      setIsDeletingSeason(false);
    }
  };

  const handleBlurMinDays = () => {
    if (localMinDays === "" || isNaN(Number(localMinDays)) || Number(localMinDays) < 1) {
      toast.error("Minimalna liczba nocy jest wymagana i musi być większa od zera");
      setLocalMinDays(initialConfig.minBookingDays);
    }
  };

  const handleBlurMaxDays = () => {
    if (localMaxDays === "" || isNaN(Number(localMaxDays)) || Number(localMaxDays) < 1) {
      toast.error("Maksymalna liczba nocy jest wymagana i musi być większa od zera");
      setLocalMaxDays(initialConfig.maxBookingDays);
    }
  };

  const handleBlurChildrenFreeAge = () => {
    if (localChildrenFreeAge === "" || isNaN(Number(localChildrenFreeAge)) || Number(localChildrenFreeAge) < 0) {
      toast.error("Wiek dziecka musi być liczbą nieujemną");
      setLocalChildrenFreeAge(initialConfig.childrenFreeAgeLimit);
    }
  };

  const handleBlurCheckIn = () => {
    if (localCheckInHour === "" || isNaN(Number(localCheckInHour)) || Number(localCheckInHour) < 0 || Number(localCheckInHour) > 23 || Number(localCheckInHour) < Number(localCheckOutHour)) {
      toast.error("Godzina rozpoczęcia doby nie może być wcześniejsza niż zakończenia i musi być z zakresu 0-23");
      setLocalCheckInHour(initialConfig.checkInHour);
    }
  };

  const handleBlurCheckOut = () => {
    if (localCheckOutHour === "" || isNaN(Number(localCheckOutHour)) || Number(localCheckOutHour) < 0 || Number(localCheckOutHour) > 23 || Number(localCheckOutHour) > Number(localCheckInHour)) {
      toast.error("Godzina zakończenia doby nie może być późniejsza niż rozpoczęcia i musi być z zakresu 0-23");
      setLocalCheckOutHour(initialConfig.checkOutHour);
    }
  };

  const handleReset = () => {
    setLocalMinDays(initialConfig.minBookingDays);
    setLocalMaxDays(initialConfig.maxBookingDays);
    setLocalChildrenFreeAge(initialConfig.childrenFreeAgeLimit);
    setLocalCheckInHour(initialConfig.checkInHour);
    setLocalCheckOutHour(initialConfig.checkOutHour);
    if (selectedSeason) {
      setSeasonDateErrors({});
      setSeasonName(selectedSeason.name);
      setSeasonDesc(selectedSeason.description || '');
      const start = dayjs(selectedSeason.startDate);
      const end = dayjs(selectedSeason.endDate);
      setSeasonStartDay(start.date());
      setSeasonStartMonth(start.month() + 1);
      setSeasonEndDay(end.date());
      setSeasonEndMonth(end.month() + 1);
      setSeasonOrder(selectedSeason.order);
    }
  };

  const startDayOptions = useMemo(
    () => Array.from({ length: getMaxDaysInMonth(seasonStartMonth) }, (_, i) => i + 1),
    [seasonStartMonth]
  );
  const endDayOptions = useMemo(
    () => Array.from({ length: getMaxDaysInMonth(seasonEndMonth) }, (_, i) => i + 1),
    [seasonEndMonth]
  );

  const handleStartMonthChange = (monthValue: number) => {
    const maxDay = getMaxDaysInMonth(monthValue);
    setSeasonStartMonth(monthValue);
    setSeasonStartDay((prev) => Math.min(prev, maxDay));
    if (seasonDateErrors.startDate || seasonDateErrors.endDate) {
      setSeasonDateErrors({});
    }
  };

  const handleEndMonthChange = (monthValue: number) => {
    const maxDay = getMaxDaysInMonth(monthValue);
    setSeasonEndMonth(monthValue);
    setSeasonEndDay((prev) => Math.min(prev, maxDay));
    if (seasonDateErrors.startDate || seasonDateErrors.endDate) {
      setSeasonDateErrors({});
    }
  };

  return (
    <>
      <form action={formAction} className={styles.settingsCard}>
        <input type="hidden" name="minBookingDays" value={localMinDays} />
        <input type="hidden" name="maxBookingDays" value={localMaxDays} />
        <input type="hidden" name="childrenFreeAgeLimit" value={localChildrenFreeAge} />
        <input type="hidden" name="checkInHour" value={localCheckInHour} />
        <input type="hidden" name="checkOutHour" value={localCheckOutHour} />

        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Długość pobytu</h2>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label htmlFor="minBookingDays" className={styles.settingLabel}>Minimalna liczba nocy:</label>
            <p className={styles.settingDescription}>Klient nie może wybrać okresu krótszego.</p>
          </div>
          <div className={styles.settingControl}>
            <input
              type="number"
              id="minBookingDays"
              value={localMinDays}
              onChange={e => setLocalMinDays(e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={handleBlurMinDays}
              className={styles.numberInput}
            />
            <input type="hidden" name="minBookingDays" value={localMinDays === "" ? "" : localMinDays} />
          </div>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label htmlFor="maxBookingDays" className={styles.settingLabel}>Maksymalna liczba nocy:</label>
            <p className={styles.settingDescription}>Klient nie może wybrać okresu dłuższego.</p>
          </div>
          <div className={styles.settingControl}>
            <input
              type="number"
              id="maxBookingDays"
              value={localMaxDays}
              onChange={e => setLocalMaxDays(e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={handleBlurMaxDays}
              className={styles.numberInput}
            />
            <input type="hidden" name="maxBookingDays" value={localMaxDays === "" ? "" : localMaxDays} />
          </div>
        </div>

        <div className={`${styles.cardHeader} ${styles.cardHeaderSpaced}`}>
          <h2 className={styles.cardTitle}>Ustawienia sezonów</h2>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label className={styles.settingLabel}>Wybierz sezon:</label>
            <p className={styles.settingDescription}>Zmiana sezonu automatycznie zapisuje edytowane dane. Daty sezonu działają cyklicznie co roku.</p>
          </div>
          <div className={styles.settingControl}>
            <select
              value={selectedSeasonId}
              onChange={handleSeasonChange}
              disabled={isUpdatingSeason || isLoadingSeasons}
              className={`${styles.dateInput} ${styles.seasonSelectFull}`}
            >
              {isLoadingSeasons ? (
                <option value="">Wczytywanie sezonów...</option>
              ) : (
                seasons.map((season) => (
                  <option key={season._id} value={season._id}>
                    {season.name} {!season.isActive && '(nieaktywny)'}
                  </option>
                ))
              )}
            </select>
            {isLoadingSeasons && (
              <p className={styles.loadingText}>
                Wczytywanie...
              </p>
            )}
          </div>
        </div>

        {selectedSeason && (
          <div className={styles.seasonDetailsBox}>
            <div className={styles.seasonActionLinks}>
              <button
                type="button"
                onClick={() => router.push(`/admin/prices`)}
                className={styles.btnActionLink}
              >
                Przejdź do ustawień cen sezonu
              </button>
              <button
                type="button"
                onClick={() => setIsEditExpanded(!isEditExpanded)}
                className={styles.btnActionLink}
                disabled={isDeletingSeason || isCreatingSeason || isUpdatingSeason}
              >
                {isEditExpanded ? 'Anuluj edycję' : 'Edytuj nazwę i opis sezonu'}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className={`${styles.btnActionLink} ${styles.btnActionLinkDanger}`}
                disabled={isDeletingSeason || isCreatingSeason || isUpdatingSeason}
              >
                Usuń ten sezon
              </button>
              <button
                type="button"
                onClick={handleToggleAddSeason}
                className={styles.btnActionLink}
                disabled={isDeletingSeason || isCreatingSeason || isUpdatingSeason}
              >
                {isAddExpanded ? 'Anuluj dodawanie nowego sezonu' : 'Dodaj nowy sezon'}
              </button>
            </div>

            {isAddExpanded && (
              <div className={styles.settingsEditNameAndDesc}>
                <div className={styles.seasonEditRow}>
                  <div className={styles.seasonEditLabelCol}><label className={styles.seasonEditLabel}>Nazwa sezonu:</label></div>
                  <div className={styles.seasonEditControlCol}>
                    <input className={styles.seasonEditInput} value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} />
                  </div>
                </div>
                <div className={styles.seasonEditRow}>
                  <div className={styles.seasonEditLabelCol}><label className={styles.seasonEditLabel}>Opis sezonu:</label></div>
                  <div className={styles.seasonEditControlCol}>
                    <input className={styles.seasonEditInput} value={newSeasonDesc} onChange={(e) => setNewSeasonDesc(e.target.value)} />
                  </div>
                </div>
                <div className={styles.seasonEditRow}>
                  <div className={styles.seasonEditLabelCol}>
                    <label className={styles.seasonEditLabel}>Kolejność na liście:</label>
                  </div>
                  <div className={styles.seasonEditControlCol}>
                    <input type="number" value={newSeasonOrder} onChange={(e) => setNewSeasonOrder(e.target.value)} className={styles.seasonEditInput} />
                  </div>
                </div>
                <div className={styles.addSeasonActions}>
                  <button
                    type="button"
                    className={styles.btnPrimary+' '+styles.createSeasonButt}
                    onClick={handleCreateSeason}
                    disabled={isCreatingSeason}
                  >
                    {isCreatingSeason ? 'Dodawanie...' : 'Utwórz sezon'}
                  </button>
                </div>
              </div>
            )}

            {isEditExpanded && (
              <div className={styles.settingsEditNameAndDesc}>
                <div className={styles.seasonEditRow}>
                  <div className={styles.seasonEditLabelCol}><label className={styles.seasonEditLabel}>Nazwa sezonu:</label></div>
                  <div className={styles.seasonEditControlCol}>
                    <input className={styles.seasonEditInput} value={seasonName} onChange={(e) => setSeasonName(e.target.value)} />
                  </div>
                </div>
                <div className={styles.seasonEditRow}>
                  <div className={styles.seasonEditLabelCol}><label className={styles.seasonEditLabel}>Opis sezonu:</label></div>
                  <div className={styles.seasonEditControlCol}>
                    <input className={styles.seasonEditInput} value={seasonDesc} onChange={(e) => setSeasonDesc(e.target.value)} />
                  </div>
                </div>
                <div className={styles.seasonEditRow}>
                  <div className={styles.seasonEditLabelCol}>
                    <label className={styles.seasonEditLabel}>Kolejność na liście:</label>
                  </div>
                  <div className={styles.seasonEditControlCol}>
                    <input type="number" value={seasonOrder} onChange={(e) => setSeasonOrder(parseInt(e.target.value) || 0)} className={styles.seasonEditInput} />
                  </div>
                </div>
              </div>
            )}
            <div className={styles.settingRow}>
              <div className={styles.settingContent}><label className={styles.settingLabel}>Data rozpoczęcia:</label></div>
              <div className={styles.settingControl}>
                <div className={styles.seasonDateGrid}>
                  <div className={styles.seasonDateCol}>
                    <label className={`${styles.settingDescription} ${styles.settingsDateDescription}`}>Dzień:</label>
                    <select
                      value={seasonStartDay}
                      onChange={(e) => {
                        setSeasonStartDay(parseInt(e.target.value, 10));
                        if (seasonDateErrors.startDate || seasonDateErrors.endDate) {
                          setSeasonDateErrors({});
                        }
                      }}
                      className={`${styles.dateInput} ${seasonDateErrors.startDate ? styles.inputError : ''}`}
                    >
                      {startDayOptions.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.seasonDateCol}>
                    <label className={`${styles.settingDescription} ${styles.settingsDateDescription}`}>Miesiąc:</label>
                    <select
                      value={seasonStartMonth}
                      onChange={(e) => handleStartMonthChange(parseInt(e.target.value, 10))}
                      className={`${styles.dateInput} ${seasonDateErrors.startDate ? styles.inputError : ''}`}
                    >
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {seasonDateErrors.startDate && (
                  <span className={styles.errorText}>{seasonDateErrors.startDate}</span>
                )}
              </div>
            </div>
            <div className={styles.settingRow}>
              <div className={styles.settingContent}><label className={styles.settingLabel}>Data zakończenia:</label></div>
              <div className={styles.settingControl}>
                <div className={styles.seasonDateGrid}>
                  <div className={styles.seasonDateCol}>
                    <label className={`${styles.settingDescription} ${styles.settingsDateDescription}`}>Dzień:</label>
                    <select
                      value={seasonEndDay}
                      onChange={(e) => {
                        setSeasonEndDay(parseInt(e.target.value, 10));
                        if (seasonDateErrors.startDate || seasonDateErrors.endDate) {
                          setSeasonDateErrors({});
                        }
                      }}
                      className={`${styles.dateInput} ${seasonDateErrors.endDate ? styles.inputError : ''}`}
                    >
                      {endDayOptions.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.seasonDateCol}>
                    <label className={`${styles.settingDescription} ${styles.settingsDateDescription}`}>Miesiąc:</label>
                    <select
                      value={seasonEndMonth}
                      onChange={(e) => handleEndMonthChange(parseInt(e.target.value, 10))}
                      className={`${styles.dateInput} ${seasonDateErrors.endDate ? styles.inputError : ''}`}
                    >
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {seasonDateErrors.endDate && (
                  <span className={styles.errorText}>{seasonDateErrors.endDate}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={`${styles.cardHeader} ${styles.cardHeaderSpaced}`}>
          <h2 className={styles.cardTitle}>Doba hotelowa</h2>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label htmlFor="checkInHour" className={styles.settingLabel}>Godzina rozpoczęcia doby (check-in):</label>
            <p className={styles.settingDescription}>Od której godziny można się zameldować w dniu przyjazdu.</p>
          </div>
          <div className={styles.settingControl}>
            <input type="number" id="checkInHour" min={0} value={localCheckInHour} onChange={(e) => setLocalCheckInHour(parseInt(e.target.value) || 0)} onBlur={handleBlurCheckIn} className={styles.numberInput} />
            <input type="hidden" name="checkInHour" value={localCheckInHour === "" ? "" : localCheckInHour} />
          </div>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label htmlFor="checkOutHour" className={styles.settingLabel}>Godzina zakończenia doby (check-out):</label>
            <p className={styles.settingDescription}>Do której godziny trzeba opuścić obiekt w dniu wyjazdu.</p>
          </div>
          <div className={styles.settingControl}>
            <input type="number" id="checkOutHour" min={0} value={localCheckOutHour} onChange={(e) => setLocalCheckOutHour(parseInt(e.target.value) || 0)} onBlur={handleBlurCheckOut} className={styles.numberInput} />
            <input type="hidden" name="checkOutHour" value={localCheckOutHour === "" ? "" : localCheckOutHour} />
          </div>
        </div>

        <div className={`${styles.cardHeader} ${styles.cardHeaderSpaced}`}>
          <h2 className={styles.cardTitle}>Dzieci</h2>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}><label htmlFor="childrenFreeAgeLimit" className={styles.settingLabel}>Bezpłatny pobyt dzieci do lat:</label></div>
          <div className={styles.settingControl}>
            <input type="number" id="childrenFreeAgeLimit" min={0} value={localChildrenFreeAge} onChange={(e) => setLocalChildrenFreeAge(parseInt(e.target.value) || 0)} onBlur={handleBlurChildrenFreeAge} className={styles.numberInput} />
            <input type="hidden" name="childrenFreeAgeLimit" value={localChildrenFreeAge === "" ? "" : localChildrenFreeAge} />
          </div>
        </div>

        <div className={`${styles.cardHeader} ${styles.cardHeaderSpaced}`}>
          <h2 className={styles.cardTitle}>Dostępność terminów</h2>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label className={styles.settingLabel}>
              Zezwalaj na zameldowanie w dniu wymeldowania poprzednich gości
            </label>
            <p className={styles.settingDescription}>
              Jeśli <strong>włączone</strong>, nowi goście mogą przyjechać tego samego dnia, w którym poprzedni wyjeżdżają (po {localCheckOutHour}:00).<br />
              Jeśli <strong>wyłączone</strong>, dzień rozpoczęcia i dzień zakończenia istniejących rezerwacji pokazują się w kalendarzu jako niedostępne do zarezerwowania dla nowych gości (zasada "sprzątanie obiektu bez pośpiechu").
            </p>
          </div>
          <div className={styles.settingControl}>
            <div className={styles.toggleWrapper}>
              <button
                type="button"
                onClick={handleToggle}
                disabled={togglePending}
                className={`${styles.toggleSwitch} ${allowCheckin ? styles.toggleOn : styles.toggleOff} ${togglePending ? styles.toggleDisabled : ''}`}
              >
                <span className={styles.toggleKnob} />
              </button>
              <span className={`${styles.toggleStatusLabel} ${allowCheckin ? styles.statusActive : styles.statusInactive}`}>
                {allowCheckin ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.floatingSaveBar} ${isAnyDirty ? styles.visible : ''}`}>
          <div className={styles.floatingSaveContent}>
            <p className={styles.floatingSaveText}>
              {isConfigDirty && isSeasonDirty ? 'Masz niezapisane zmiany w ustawieniach i sezonie.' :
                isSeasonDirty ? `Niezapisane zmiany w sezonie: ${selectedSeason?.name}` :
                  'Masz niezapisane zmiany w ustawieniach głównych.'}
            </p>
            <div className={styles.floatingSaveActions}>
              <button type="button" className={styles.btnSecondary} onClick={handleReset} disabled={isPending || isUpdatingSeason}>Odrzuć</button>
              <button
                type={isConfigDirty ? "submit" : "button"}
                className={styles.btnPrimary}
                disabled={isPending || isUpdatingSeason}
                onClick={() => { if (!isConfigDirty && isSeasonDirty) handleUpdateSeasonSilent() }}
              >
                {isPending || isUpdatingSeason ? 'Zapisywanie...' : 'Zapisz wszystko'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSeasonConfirm}
        title="Usunąć sezon?"
        confirmText="Usuń sezon"
        cancelText="Anuluj"
        loadingText="Usuwanie..."
        confirmVariant="danger"
        isLoading={isDeletingSeason}
      >
        <p>
          Czy na pewno chcesz usunąć sezon &quot;{selectedSeason?.name}&quot;?
        </p>
      </Modal>
    </>
  );
}
