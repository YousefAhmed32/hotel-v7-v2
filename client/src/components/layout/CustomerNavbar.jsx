import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hotel,
  Menu,
  X,
  LogOut,
  BookOpen,
  User,
  LayoutDashboard,
  ChevronDown,
  Compass,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  selectUser,
  selectIsAuthenticated,
  logoutUser,
} from "@/features/auth/authSlice";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

/* ── Brand tokens ── */
const B = {
  primary: "#f6a003",
  primaryDark: "#d98902",
  primaryBg: "#fff8ed",
  primaryRing: "#fde68a",
};

/* ── Role config — labels come from i18n ── */
const ROLE_META = {
  owner:        { bg: "#f3e8ff", text: "#7e22ce" },
  manager:      { bg: "#dbeafe", text: "#1d4ed8" },
  receptionist: { bg: "#ccfbf1", text: "#0f766e" },
  superadmin:   { bg: "#ffe4e6", text: "#be123c" },
  customer:     { bg: "#fff8ed", text: "#b45309" },
};

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
const Avatar = ({ name, size = "md" }) => {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sz} rounded-full text-white flex items-center justify-center font-bold
                  flex-shrink-0 ring-2 ring-white shadow-sm`}
      style={{ background: `linear-gradient(135deg, ${B.primary}, ${B.primaryDark})` }}
    >
      {initials}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  const meta = ROLE_META[role] || ROLE_META.customer;
  /* Map role → translation key */
  const labelKey = {
    owner:        "staff.owner",
    manager:      "staff.manager",
    receptionist: "staff.receptionist",
    superadmin:   "superadmin.title",
    customer:     "staff.member",
  }[role] || "staff.member";

  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: meta.bg, color: meta.text }}
    >
      {t(labelKey)}
    </span>
  );
};

const NavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="relative text-sm font-medium text-neutral-600 transition-colors duration-200 group"
    onMouseEnter={(e) => (e.currentTarget.style.color = B.primary)}
    onMouseLeave={(e) => (e.currentTarget.style.color = "")}
  >
    {children}
    <span
      className="absolute -bottom-0.5 left-0 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-full"
      style={{ background: B.primary }}
    />
  </Link>
);

const DropItem = ({ to, icon: Icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700
               rounded-xl mx-1 transition-all duration-150"
    onMouseEnter={(e) => {
      e.currentTarget.style.background = B.primaryBg;
      e.currentTarget.style.color = B.primaryDark;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "";
      e.currentTarget.style.color = "";
    }}
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    {label}
  </Link>
);

const MobileNavItem = ({ to, icon: Icon, label, onClick, highlight }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold
               transition-all duration-150 text-neutral-700"
    style={
      highlight
        ? { background: B.primaryBg, color: B.primaryDark, border: `1px solid ${B.primaryRing}` }
        : {}
    }
    onMouseEnter={(e) => {
      if (!highlight) {
        e.currentTarget.style.background = "#f5f5f5";
        e.currentTarget.style.color = B.primary;
      }
    }}
    onMouseLeave={(e) => {
      if (!highlight) {
        e.currentTarget.style.background = "";
        e.currentTarget.style.color = "";
      }
    }}
  >
    <Icon className="w-4 h-4 flex-shrink-0" style={highlight ? { color: B.primary } : {}} />
    {label}
  </Link>
);

/* ─────────────────────────────────────────
   Language Toggle Button
───────────────────────────────────────── */
const LangButton = () => {
  const { i18n } = useTranslation();
  const toggle = () => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200"
      style={{ background: B.primaryBg, color: B.primary, border: `1px solid ${B.primaryRing}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = B.primary)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = B.primaryRing)}
    >
      🌐 {i18n.language === "ar" ? "EN" : "AR"}
    </button>
  );
};

/* ─────────────────────────────────────────
   Main Navbar
───────────────────────────────────────── */
export const CustomerNavbar = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);

  const isStaff = user?.role && user.role !== "customer";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success(t("auth.logoutSuccess"));
    navigate("/auth/login");
    setMenuOpen(false);
    setUserMenu(false);
  };

  const close = () => { setMenuOpen(false); setUserMenu(false); };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md
                   border-b transition-all duration-300"
        style={{
          borderColor: scrolled ? "#e5e7eb" : "#f5f5f5",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.07)" : "none",
        }}
      >
        <nav
          className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {/* ── LOGO ── */}
          <Link to="/" onClick={close} className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-shadow duration-300"
              style={{
                background: `linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
                boxShadow: `0 2px 8px ${B.primary}40`,
              }}
            >
              <Hotel className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl font-bold text-neutral-900 tracking-tight">
              {isRtl ? (
                <>لكس<span style={{ color: B.primary }}>ستاي</span></>
              ) : (
                <>Lux<span style={{ color: B.primary }}>Stay</span></>
              )}
            </span>
          </Link>

          {/* ── DESKTOP CENTER LINKS ── */}
          <div className="hidden md:flex items-center gap-7">
            <NavLink to="/hotels">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                {t("nav.exploreHotels")}
              </span>
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/profile/bookings">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {t("nav.myBookings")}
                </span>
              </NavLink>
            )}
          </div>

          {/* ── DESKTOP RIGHT ── */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language toggle — always visible */}
            <LangButton />

            {isAuthenticated ? (
              <>
                {/* Staff Dashboard button */}
                {isStaff && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl
                               text-white text-xs font-bold transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
                      boxShadow: `0 2px 10px ${B.primary}40`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 4px 18px ${B.primary}60`)}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 2px 10px ${B.primary}40`)}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {t("sidebar.dashboard")}
                  </Link>
                )}

                {/* My Room */}
                <Link
                  to="/my-room"
                  className="flex items-center gap-1.5 text-xs font-semibold
                             px-3 py-2 rounded-xl border transition-all duration-200"
                  style={{ borderColor: B.primaryRing, color: B.primaryDark, background: B.primaryBg }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = B.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = B.primaryRing)}
                >
                  🛎 {t("nav.myRoom")}
                </Link>

                <div className="w-px h-5 bg-neutral-200" />

                {/* User dropdown trigger */}
                <div className="relative" ref={dropRef}>
                  <button
                    onClick={() => setUserMenu((p) => !p)}
                    className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-2xl
                               hover:bg-neutral-100 transition-colors duration-200"
                  >
                    <Avatar name={user?.name} />
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-neutral-800 leading-tight">
                        {user?.name?.split(" ")[0]}
                      </p>
                      <RoleBadge role={user?.role} />
                    </div>
                    <ChevronDown
                      className="w-3.5 h-3.5 text-neutral-400 transition-transform duration-200"
                      style={{ transform: userMenu ? "rotate(180deg)" : "rotate(0)" }}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-12 bg-white rounded-2xl
                                   border border-neutral-100 py-2 z-50 overflow-hidden"
                        style={{
                          [isRtl ? "left" : "right"]: 0,
                          width: 228,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        }}
                      >
                        {/* User header */}
                        <div className="px-4 py-3 mb-1" style={{ borderBottom: "1px solid #f5f5f5" }}>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={user?.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-neutral-900 truncate">{user?.name}</p>
                              <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        {isStaff && (
                          <>
                            <DropItem to="/admin" icon={LayoutDashboard} label={t("sidebar.dashboard")} onClick={close} />
                            <div className="mx-4 my-1" style={{ height: 1, background: "#f5f5f5" }} />
                          </>
                        )}

                        <DropItem to="/profile"          icon={User}      label={t("nav.myProfile")}  onClick={close} />
                        <DropItem to="/my-room"          icon={Hotel}     label={t("nav.myRoom")}     onClick={close} />
                        <DropItem to="/profile/bookings" icon={BookOpen}  label={t("nav.myBookings")} onClick={close} />

                        <div className="mx-4 my-1.5" style={{ height: 1, background: "#f5f5f5" }} />

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                                     text-red-500 rounded-xl mx-1 w-[calc(100%-8px)]
                                     hover:bg-red-50 transition-colors duration-150"
                        >
                          <LogOut className="w-4 h-4" />
                          {t("nav.logOut")}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="text-sm font-semibold text-neutral-700 px-4 py-2 rounded-xl
                             hover:bg-neutral-100 transition-all duration-200"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  to="/auth/register"
                  className="text-sm font-bold text-white px-4 py-2 rounded-xl transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
                    boxShadow: `0 2px 10px ${B.primary}40`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 4px 18px ${B.primary}60`)}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 2px 10px ${B.primary}40`)}
                >
                  {t("nav.getStarted")}
                </Link>
              </div>
            )}
          </div>

          {/* ── MOBILE HAMBURGER ── */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center
                       hover:bg-neutral-100 text-neutral-600 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </nav>

        {/* ── MOBILE MENU ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-white border-b border-neutral-200"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            >
              <div className="px-4 py-4 space-y-1.5" dir={isRtl ? "rtl" : "ltr"}>
                {/* Mobile user strip */}
                {isAuthenticated && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-2xl mb-2"
                    style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
                  >
                    <Avatar name={user?.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">{user?.name}</p>
                      <RoleBadge role={user?.role} />
                    </div>
                    {/* Language toggle in mobile menu */}
                    <LangButton />
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="flex justify-end mb-2">
                    <LangButton />
                  </div>
                )}

                <MobileNavItem to="/hotels" icon={Compass} label={t("nav.exploreHotels")} onClick={close} />

                {isAuthenticated && (
                  <>
                    {isStaff && (
                      <MobileNavItem to="/admin" icon={LayoutDashboard} label={t("sidebar.dashboard")} onClick={close} highlight />
                    )}
                    <MobileNavItem to="/my-room"          icon={Hotel}     label={t("nav.myRoom")}     onClick={close} />
                    <MobileNavItem to="/profile/bookings" icon={BookOpen}  label={t("nav.myBookings")} onClick={close} />
                    <MobileNavItem to="/profile"          icon={User}      label={t("nav.myProfile")}  onClick={close} />

                    <div className="my-2" style={{ height: 1, background: "#f0f0f0" }} />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl
                                 text-sm font-semibold text-red-500 hover:bg-red-50
                                 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("nav.logOut")}
                    </button>
                  </>
                )}

                {!isAuthenticated && (
                  <div className="flex gap-2 pt-2">
                    <Link
                      to="/auth/login"
                      onClick={close}
                      className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl
                                 border border-neutral-200 text-neutral-700 hover:bg-neutral-50
                                 transition-colors duration-200"
                    >
                      {t("nav.signIn")}
                    </Link>
                    <Link
                      to="/auth/register"
                      onClick={close}
                      className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl text-white
                                 transition-all duration-200"
                      style={{
                        background: `linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
                        boxShadow: `0 2px 10px ${B.primary}40`,
                      }}
                    >
                      {t("nav.getStarted")}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};