"use client";

import { useCallback, useEffect, useState } from "react";

const groupMembers: Record<string, string[]> = {
  "1": ["alice", "bob", "carol"],
  "2": ["bob", "dan"],
};

type Group = {
  id: number;
  name: string;
};

const userProfiles = {
  alice: {
    displayName: "alice",
    avatar: "🐱",
    color: "bg-orange-100",
  },
  bob: {
    displayName: "bob",
    avatar: "🐶",
    color: "bg-blue-100",
  },
  carol: {
    displayName: "carol",
    avatar: "🐸",
    color: "bg-green-100",
  },
  dan: {
    displayName: "dan",
    avatar: "🐻",
    color: "bg-purple-100",
  },
};
const translations = {
  th: {
    subtitle: "จัดการค่าใช้จ่ายร่วมกัน",
    currency: "บาท",
    language: "ภาษา",
    user: "ผู้ใช้งาน",
    selectGroup: "รายการบิล",
    balances: "สรุปยอดคงเหลือ",
    totalPaid: "ยอดที่จ่าย",
    totalShare: "ส่วนแบ่งค่าใช้จ่าย",
    netBalance: "ยอดคงเหลือสุทธิ",
    addExpense: "เพิ่มค่าใช้จ่าย/บิล",
    expenseHistory: "ประวัติค่าใช้จ่าย",
    paidBy: "จ่ายโดย",
    expenseFormComing: "แบบฟอร์มเพิ่มค่าใช้จ่าย",
    groupBalances: "สรุปยอดกลุ่ม",
    expenseFormMessage: "กรอกข้อมูลเพื่อเพิ่มค่าใช้จ่าย",
    expenseTitle: "เพิ่มค่าใช้จ่าย/บิล",
    description: "รายละเอียด",
    amount: "จำนวนเงิน (บาท)",
    splitMethod: "วิธีแบ่งค่าใช้จ่าย",
    equal: "เท่ากัน",
    exact: "กำหนดเอง",
    splitBetween: "แบ่งค่าใช้จ่ายระหว่าง",
    splitPreview: "ตัวอย่างการแบ่งค่าใช้จ่าย",
    expenseDescription: "รายละเอียด",
    expensePlaceholder: "เช่น ค่าอาหาร, โรงแรม, แท็กซี่",
    allocated: "ยอดที่แบ่งแล้ว",
    remaining: "ยอดคงเหลือ",
    accessDenied: "คุณไม่มีสิทธิ์เข้าถึงกลุ่มนี้",
    expenseCreated: "เพิ่มค่าใช้จ่ายเรียบร้อยแล้ว",
    invalidExpense: "กรุณาตรวจสอบข้อมูลค่าใช้จ่าย",
    fetchFailed: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่",
    createFailed: "ไม่สามารถเพิ่มค่าใช้จ่ายได้",
    deleteSuccess: "ลบรายการเรียบร้อยแล้ว",
    deleteFailed: "ไม่สามารถลบรายการได้ กรุณาลองใหม่",
    deleteTitle: "ยืนยันการลบ",
    cancel: "ยกเลิก",
    confirmDelete: "ยืนยันการลบ",
    success: "สำเร็จ",
    error: "เกิดข้อผิดพลาด",
    expenseDetails: "รายละเอียดค่าใช้จ่าย",
    payerBadge: "ผู้จ่าย",
    deleteExpense: "ลบรายการ",
    deleteConfirm: "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
    Payer: "ผู้จ่าย",
  },
  en: {
    subtitle: "Shared Expense Management",
    currency: "THB",
    language: "Language",
    user: "User",
    selectGroup: "Select Group",
    balances: "Group Balances",
    totalPaid: "Total paid",
    totalShare: "Total share",
    netBalance: "Net balance",
    addExpense: "Add Expense",
    expenseHistory: "Expense History",
    paidBy: "Paid by",
    expenseFormComing: "Add expense form",
    groupBalances: "Group Balances",
    expenseFormMessage: "Enter details to add an expense",
    expenseTitle: "Add Expense",
    description: "Description",
    amount: "Amount (THB)",
    splitMethod: "Split method",
    equal: "Equal",
    exact: "Exact",
    splitBetween: "Split between",
    splitPreview: "Split Preview",
    expenseDescription: "Description",
    expensePlaceholder: "e.g. Lunch, Hotel, Taxi",
    allocated: "Allocated",
    remaining: "Remaining",
    accessDenied: "You are not a member of this group.",
    expenseCreated: "Expense created successfully!",
    invalidExpense: "Please check the expense information.",
    fetchFailed: "Failed to load group data. Please try again.",
    createFailed: "Failed to create expense.",
    deleteSuccess: "Expense deleted successfully.",
    deleteFailed: "Failed to delete expense.",
    deleteTitle: "Confirm Delete",
    cancel: "Cancel",
    confirmDelete: "Confirm Delete?",
    success: "Success",
    error: "Error",
    expenseDetails: "Expense Details",
    payerBadge: "Payer",
    deleteExpense: "Delete Expense",
    deleteConfirm: "Are you sure you want to delete this expense?",
    Payer: "Payer"
  },
};

export default function Home() {
  const [groupsLoadedForUser, setGroupsLoadedForUser] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [language, setLanguage] = useState<"th" | "en">("th");
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [selectedUser, setSelectedUser] = useState("alice");
  const [selectedGroup, setSelectedGroup] = useState("1");
  const availableMembers = groupMembers[selectedGroup] ?? [];
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("alice");
  const [splitType, setSplitType] = useState<"equal" | "exact">("equal");
  const [expandedExpenseId, setExpandedExpenseId] = useState<number | null>(null);
  const [splitMembers, setSplitMembers] = useState<string[]>([
    "alice",
    "bob",
    "carol",
  ]);
  const [exactSplits, setExactSplits] = useState<Record<string, string>>({
    alice: "",
    bob: "",
    carol: "",
    dan: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<
    "confirm" | "success" | "error" | null
  >(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [balances, setBalances] = useState<
    {
      username: string;
      total_paid: string;
      total_share: string;
      balance: string;
    }[]
  >([]);

    const [expenses, setExpenses] = useState<
    {
      id: number;
      description: string;
      amount: string;
      payer: string;
      created_by: string;
      splits: {
        username: string;
        amount: string;
      }[];
    }[]
  >([]);

  const fetchUserGroups = useCallback(async () => {
    setGroupsLoadedForUser("");
    setIsLoadingGroups(true);
    setBalances([]);
    setExpenses([]);
    setExpandedExpenseId(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/groups", {
        headers: {
          "X-User": selectedUser,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load groups.");
      }

      const data: Group[] = await response.json();
      setGroups(data);

      const hasSelectedGroup = data.some(
        (group) => String(group.id) === selectedGroup
      );

      if (!hasSelectedGroup) {
        const nextGroupId = data.length > 0 ? String(data[0].id) : "";
        const members = groupMembers[nextGroupId] ?? [];

        setSelectedGroup(nextGroupId);
        setSplitMembers(members);
        setPayer(members[0] ?? "");
        setExactSplits({
          alice: "",
          bob: "",
          carol: "",
          dan: "",
        });
      }

      setGroupsLoadedForUser(selectedUser);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      setGroups([]);
      setSelectedGroup("");
      setBalances([]);
      setExpenses([]);
      setGroupsLoadedForUser("");
    } finally {
      setIsLoadingGroups(false);
    }
  }, [selectedUser, selectedGroup, setExpandedExpenseId]);

  const fetchGroupData = useCallback(async () => {
    if (!selectedGroup || groupsLoadedForUser !== selectedUser) return;

    try {
      const headers = { "X-User": selectedUser };

      const [balancesResponse, expensesResponse] = await Promise.all([
        fetch(
          `http://127.0.0.1:8000/groups/${selectedGroup}/balances`,
          { headers }
        ),
        fetch(
          `http://127.0.0.1:8000/groups/${selectedGroup}/expenses`,
          { headers }
        ),
      ]);

      if (!balancesResponse.ok || !expensesResponse.ok) {
        throw new Error("Failed to fetch group data.");
      }

      const balancesData = await balancesResponse.json();
      const expensesData = await expensesResponse.json();

      setBalances(balancesData);
      setExpenses(expensesData);
      setSubmitMessage("");
    } catch (error) {
      console.error("Failed to fetch group data:", error);
      setBalances([]);
      setExpenses([]);
      setSubmitMessage(translations[language].fetchFailed);
    } finally {
    }
  }, [selectedUser, selectedGroup, language, groupsLoadedForUser]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUserGroups();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchUserGroups]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchGroupData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchGroupData]);

  function handleGroupChange(groupId: string) {
    const members = groupMembers[groupId] ?? [];

    setSelectedGroup(groupId);
    setSplitMembers(members);
    setPayer(members[0] ?? "");

    setExactSplits({
      alice: "",
      bob: "",
      carol: "",
      dan: "",
    });
  }

  function toggleSplitMember(username: string) {
    setSplitMembers((currentMembers) => {
      if (currentMembers.includes(username)) {
        return currentMembers.filter((member) => member !== username);
      }
      return [...currentMembers, username];
    });
  }

  function calculateEqualSplit() {
    const totalCents = toCents(amount);

    if (
      totalCents === null ||
      totalCents <= 0 ||
      splitMembers.length === 0
    ) {
      return [];
    }

    const baseShare = Math.floor(totalCents / splitMembers.length);
    const remainder = totalCents % splitMembers.length;

    return splitMembers.map((username, index) => ({
      username,
      amount: (baseShare + (index < remainder ? 1 : 0)) / 100,
    }));
  }

  function toCents(value: string): number | null {
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      return null;
    }

    const [whole, decimal = ""] = value.split(".");

    return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  }

  function getExactAllocatedCents(): number | null {
    const amounts = splitMembers.map((username) =>
      toCents(exactSplits[username] || "")
    );

    if (amounts.some((value) => value === null)) {
      return null;
    }

    return amounts.reduce<number>(
      (total, value) => total + (value ?? 0),
      0
    );
  }

  function getExactRemainingCents(): number | null {
    const totalCents = toCents(amount);
    const allocatedCents = getExactAllocatedCents();

    if (totalCents === null || allocatedCents === null) {
      return null;
    }

    return totalCents - allocatedCents;
  }

  function calculateExactSplit() {
    return splitMembers.map((username) => ({
      username,
      amount: exactSplits[username] || "0",
    }));
  }

  function isExpenseFormValid() {
    const totalCents = toCents(amount);

    if (
      description.trim().length === 0 ||
      totalCents === null ||
      totalCents <= 0 ||
      splitMembers.length === 0
    ) {
      return false;
    }

    if (splitType === "exact") {
      const allocatedCents = getExactAllocatedCents();

      return (
        allocatedCents !== null &&
        allocatedCents === totalCents &&
        splitMembers.every((username) => {
          const cents = toCents(exactSplits[username] || "");
          return cents !== null && cents > 0;
        })
      );
    }

    return true;
  }

  async function handleSubmitExpense() {
    if (!isExpenseFormValid()) {
      setSubmitMessage(translations[language].invalidExpense);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/groups/${selectedGroup}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User": selectedUser,
          },
          body: JSON.stringify({
            description: description.trim(),
            amount: amount,
            payer: payer,
            split_type: splitType,
            split_members: splitType === "equal" ? splitMembers : [],
            exact_splits:
              splitType === "exact"
                ? calculateExactSplit()
                : [],
          }),
        }
      );

      const data = await response.json();

      if (response.status === 403 || response.status === 404) {
        setSubmitMessage(translations[language].accessDenied);
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || translations[language].createFailed);
      }

      setDescription("");
      setAmount("");
      setExactSplits({
        alice: "",
        bob: "",
        carol: "",
        dan: "",
      });

      await fetchGroupData();
      setSubmitMessage(translations[language].expenseCreated);

    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : translations[language].createFailed
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteExpense(expenseId: number) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/groups/${selectedGroup}/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            "X-User": selectedUser,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || translations[language].deleteFailed);
      }

      await fetchGroupData();

      setDeleteModal("success");
      setDeleteMessage(translations[language].deleteSuccess);
      setPendingDeleteId(null);

      setTimeout(() => {
        setDeleteModal(null);
      }, 2500);
    } catch (error) {
      setDeleteModal("error");
      setDeleteMessage(
        error instanceof Error
          ? error.message
          : translations[language].deleteFailed
      );
    }
  }

  function confirmDeleteExpense() {
    if (pendingDeleteId === null) return;

    void handleDeleteExpense(pendingDeleteId);
  }

  function changeLanguage(nextLanguage: "th" | "en") {
    if (nextLanguage === language) return;

    setIsChangingLanguage(true);

    setTimeout(() => {
      setLanguage(nextLanguage);
      setIsChangingLanguage(false);
    }, 120);
  }

  function changeUser(nextUser: string) {
    if (nextUser === selectedUser) return;

    setIsChangingLanguage(true);
    setSubmitMessage("");

    setTimeout(() => {
      setSelectedUser(nextUser);
      setIsChangingLanguage(false);
    }, 120);
  }

  return (
    <main className={`min-h-screen bg-slate-50 text-slate-900 transition-opacity duration-300 ease-in-out ${
        isChangingLanguage ? "opacity-0" : "opacity-100"
      }`}
    >
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">
              SplitBill
            </h1>
            <p className="text-sm text-slate-500">
              {translations[language].subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="text-sm font-medium">
              {translations[language].language}
            </label>

            <select
              value={language}
              onChange={(event) =>
                changeLanguage(event.target.value as "th" | "en")
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              aria-label="Select language"
            >
              <option value="th">ไทย</option>
              <option value="en">English</option>
            </select>           
            <label htmlFor="user" className="text-sm font-medium">
              {translations[language].user}
            </label>

            <select
              id="user"
              value={selectedUser}
              onChange={(event) => changeUser(event.target.value)}
              className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {Object.keys(userProfiles).map((user) => (
                <option key={user} value={user}>
                  {userProfiles[user as keyof typeof userProfiles].avatar} {user}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            {translations[language].selectGroup}
          </h2>
          <select
            value={selectedGroup}
            onChange={(event) => handleGroupChange(event.target.value)}
            disabled={isLoadingGroups || groups.length === 0}
            className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {isLoadingGroups ? (
              <option value="">Loading groups...</option>
            ) : groups.length === 0 ? (
              <option value="">No groups available</option>
            ) : (
              groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))
            )}
          </select>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">
            {translations[language].groupBalances}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((item) => (
              <div
                key={item.username}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl transition-all duration-300 ease-in-out ${
                      userProfiles[item.username as keyof typeof userProfiles].color
                    }`}
                  >
                    {userProfiles[item.username as keyof typeof userProfiles].avatar}
                  </div>

                  <h3 className="font-semibold">{item.username}</h3>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {translations[language].totalPaid}: {Number(item.total_paid).toFixed(2)} {translations[language].currency}
                </p>
                <p className="text-sm text-slate-500">
                  {translations[language].totalShare}: {Number(item.total_share).toFixed(2)} {translations[language].currency}
                </p>
                <p className="mt-3 text-xl font-bold text-indigo-600">
                  {Number(item.balance) > 0 ? "+" : ""}
                  {Number(item.balance).toFixed(2)}{" "}
                  {translations[language].currency}
                </p>
                <p className="text-xs text-slate-400">
                  {translations[language].netBalance}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-semibold">
              {translations[language].addExpense}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {translations[language].expenseDescription}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={translations[language].expensePlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Amount ({translations[language].currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {translations[language].paidBy}
                </label>
                <select
                  value={payer}
                  onChange={(event) => setPayer(event.target.value)}
                  className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {availableMembers.map((user) => (
                    <option key={user} value={user}>
                      {userProfiles[user as keyof typeof userProfiles].avatar} {user}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {translations[language].splitMethod}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="equal"
                      checked={splitType === "equal"}
                      onChange={() => setSplitType("equal")}
                    />
                    {translations[language].equal}
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="exact"
                      checked={splitType === "exact"}
                      onChange={() => setSplitType("exact")}
                    />
                    {translations[language].exact}
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {translations[language].splitBetween}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {availableMembers.map((user) => (
                    <label key={user} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={splitMembers.includes(user)}
                        onChange={() => toggleSplitMember(user)}
                      />
                      <span>
                        {userProfiles[user as keyof typeof userProfiles].avatar} {user}
                      </span>
                    </label>
                  ))}
                </div>
              </div><div className="rounded-lg bg-slate-50 p-4">
                <h3 className="mb-3 font-semibold">{translations[language].splitPreview}</h3>

                {splitType === "equal" ? (
                  <div className="space-y-2">
                    {calculateEqualSplit().map((item) => (
                      <div
                        key={item.username}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {userProfiles[item.username as keyof typeof userProfiles].avatar}{" "}
                          {item.username}
                        </span>
                        <span className="font-medium">
                          {item.amount.toFixed(2)} {translations[language].currency}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {splitMembers.map((username) => (
                      <div
                        key={username}
                        className="flex items-center justify-between gap-3"
                      >
                        <label className="text-sm">
                          {userProfiles[username as keyof typeof userProfiles].avatar}{" "}
                          {username}
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={exactSplits[username] || ""}
                          onChange={(event) =>
                            setExactSplits((current) => ({
                              ...current,
                              [username]: event.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-right"
                        />
                      </div>
                    ))}<div className="border-t border-slate-200 pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{translations[language].allocated}</span>
                          <span>
                            {((getExactAllocatedCents() ?? 0) / 100).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm font-medium">
                          <span>{translations[language].remaining}</span>
                          <span
                            className={
                              getExactRemainingCents() === 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {getExactRemainingCents() === null
                              ? "--"
                              : (getExactRemainingCents()! / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSubmitExpense}
                disabled={!isExpenseFormValid() || isSubmitting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? "Saving..." : translations[language].addExpense}
              </button>

              {submitMessage && (
                <p className="text-sm text-slate-600">
                  {submitMessage}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {translations[language].expenseHistory}
            </h2>

            <div className="space-y-3">
              {expenses.map((expense) => {
                const isExpanded = expandedExpenseId === expense.id;
                const canDelete = expense.payer === selectedUser;

                return (
                  <div
                    key={expense.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedExpenseId(
                          isExpanded ? null : expense.id
                        )
                      }
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div>
                        <p className="font-medium">{expense.description}</p>

                        <p className="mt-1 text-sm text-slate-500">
                          {translations[language].paidBy} {expense.payer}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          {Number(expense.amount).toFixed(2)}{" "}
                          {translations[language].currency}
                        </p>

                        <p className="text-xs text-indigo-600">
                          {isExpanded ? "Hide details ▲" : "View details ▼"}
                        </p>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <h3 className="mb-3 text-sm font-semibold">
                          {translations[language].expenseDetails}
                        </h3>

                        <div className="space-y-2">
                          {expense.splits.map((split) => (
                            <div
                              key={split.username}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {userProfiles[
                                  split.username as keyof typeof userProfiles
                                ].avatar}{" "}
                                {split.username}

                                {split.username === expense.payer && (
                                  <span className="ml-1 text-xs font-medium text-indigo-600">
                                    ({translations[language].Payer})
                                  </span>
                                )}
                              </span>

                              <span className="font-medium">
                                {Number(split.amount).toFixed(2)}{" "}
                                {translations[language].currency}
                              </span>
                            </div>
                          ))}
                        </div>

                        {canDelete && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setPendingDeleteId(expense.id);
                                setDeleteModal("confirm");
                              }}
                              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                            >
                              {translations[language].deleteExpense}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    {deleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
          {deleteModal === "confirm" ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
                ✕
              </div>

              <h2 className="mb-2 text-lg font-bold">
                {translations[language].deleteTitle}
              </h2>

              <p className="mb-6 text-sm text-slate-500">
                {translations[language].deleteConfirm}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModal(null);
                    setPendingDeleteId(null);
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  {translations[language].cancel}
                </button>

                <button
                  type="button"
                  onClick={confirmDeleteExpense}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                >
                  {translations[language].confirmDelete}
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                  deleteModal === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {deleteModal === "success" ? "✓" : "!"}
              </div>

              <h2 className="mb-2 text-lg font-bold">
                {deleteModal === "success"
                  ? translations[language].success
                  : translations[language].error}
              </h2>

              <p className="text-sm text-slate-500">
                {deleteMessage}
              </p>
            </>
          )}
        </div>
      </div>
    )}</main>
  );
}
