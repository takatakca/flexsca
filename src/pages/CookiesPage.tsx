import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/seo/Seo";
import { ManageCookiesLink } from "@/consent/ManageCookiesLink";

export default function CookiesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Cookies | FLEX'S"
        description="This cookie policy explains how and why FLEX'S uses technology to collect information about the use of our website."
        path="/cookies"
      />
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-xl font-bold text-foreground tracking-tight">
            FLEX'S
          </button>
          <nav className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground">
              Explore ▾
            </button>
            <button onClick={() => navigate("/auth/login")} className="text-sm text-muted-foreground hover:text-foreground">
              Login
            </button>
            <Button size="sm" onClick={() => navigate("/auth/welcome")}>
              Join as a Professional
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Cookies</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <h2 className="text-xl font-bold text-foreground">What is this document and why should I read it?</h2>
          <p>
            This cookie policy explains how and why FLEX'S (also referred to as "flex's.ca", "we", "our" and "us") uses technology
            to collect information about the use of our website www.flexs.ca ("the Website") and to distinguish you from other users of our
            Website in order to improve your experience when you browse the Website.
          </p>
          <p>
            This cookie policy should be read in conjunction with our website privacy policy available at flexs.ca/privacy-policy.
          </p>

          <h2 className="text-xl font-bold text-foreground">Cookies and similar technologies: what are they?</h2>
          <p>
            When you use our Website, we may collect certain information by automated means, such as cookies and similar technologies which
            may include web beacons or SDKs.
          </p>
          <p>
            A "cookie" is a file that websites send to a visitor's computer or other internet-connected device to uniquely identify the visitor's browser
            or to store information or settings on the device.
          </p>
          <p>
            Web beacons (also called pixel tags or clear GIFs) are small image file elements placed on web pages and web-based documents, such
            as newsletters and the web together with cookies to recognise visitors and how they interact with that content. Using these tools we
            can better understand which content is of interest to our visitors. An SDK is a piece of code code that is included in mobile applications
            and works in a similar way.
          </p>

          <h2 className="text-xl font-bold text-foreground">Why do we use cookies and similar technologies?</h2>
          <p>
            The information we collect in this manner enables us to better serve you when you return to our Website - for example, it can
            remember your email address to save you having to enter it manually upon your return.
          </p>
          <p>
            We also use cookies to track responses to our marketing materials, such as emails and online advertisements. Your browser may tell you
            how to be notified when you receive certain types of cookies or how to restrict or disable certain types of cookies. Please be aware that
            restricting cookies may impact the functionality of this Website.
          </p>

          <h2 className="text-xl font-bold text-foreground">What types of cookies and similar technology do we use?</h2>
          <p>
            The information we collect in this manner enables us to better serve you when you return to our Website - for example, it can
            remember your email address to save you having to enter it manually upon your return.
          </p>

          <h3 className="text-lg font-semibold text-foreground">Types of cookies</h3>
          <p>This Website uses a number of different categories of cookies, in particular:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>"Strictly necessary"</strong> cookies which are necessary for the functionality of our Website. These cookies are essential in order to enable
              users to move around a website and use its features. These are always active, and cannot be turned off when you visit our Website.
              We do not require your consent to use strictly necessary cookies.
            </li>
            <li>
              <strong>"Performance"</strong> cookies collect information about how users navigate our Website, for instance which pages users access most
              frequently. They identify your user interest, which enables find suitable pages to load correctly, which pages were not used
              often, which pages take a long time to load, which pages users tend to visit and in what order. These cookies can be turned off in your
              browser settings, but please note that this will mean that our website will not remember your interactions with our Website.
            </li>
            <li>
              <strong>"Functionality"</strong> cookies allow a website to remember choices made by a user based on e.g. language or region of user.
            </li>
            <li>
              <strong>"Targeting or advertising"</strong> cookies are used on a website to deliver adverts relevant to an identified machine or other device (not a
              named or otherwise identifiable person), which are tailored to interests associated with the website activity tied to that machine or
              device. For example, if a cookie on a third party website recognises that a particular product was purchased from a particular online store,
              that cookie may "talk to" marketing cookies on this website to ensure advertisements about similar products are delivered on from this
              website as accessed from that device. These cookies are also used to limit the number of times a user sees an advertisement as well
              as to help measure the effectiveness of the advertising campaign. They may also remember that this website has been visited from a
              device and share that information with marketing organisations. They may be used to monitor from which advertising source a user
              was first directed towards a website, so that the operator of that website knows whether it is worth investing in a particular
              advertising source. Usually this type of cookie will be operated by a third party.
            </li>
            <li>
              <strong>Third party cookies</strong>: Our Website also uses marketing automation technology to collect data on visitor behaviour. These cookies help us to track your visits to
              our Website and enable us to create an engaging marketing experience for you. We also use these cookies to understand your
              interaction with the emails we send you, and to ensure we're sending you relevant information; specifically these cookies let us know
              whether our emails have been opened, and which links are clicked.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-foreground">How do we store cookies and for how long?</h2>
          <p>
            Cookies are either stored in memory (session cookies) or placed on the user's hard disk (persistent cookies). The key difference between
            the two is the time of expiration. Session cookies expire at the end of the session, i.e. when a user closes his browser window; the
            session cookie is deleted.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Persistent cookies do not expire at the end of the session and remain on the hard disk.</li>
            <li>Session cookies allow users to be recognised within a website so any page changes or item or data selection is done
              remembered from page to page.</li>
          </ul>
          <p>
            For more information on the cookies we use on this Website and how long we store them for, please see the cookies table below.
          </p>

          <h2 className="text-xl font-bold text-foreground">Do we use web analytics and interest-based advertising?</h2>
          <p>
            We may use web analytics services on our websites, such as those of Google Analytics, Google AdSense or Meta. The service providers
            that administer these services use technologies such as cookies to help us analyse how visitors use the site. The information collected
            through these means (including IP address) is disclosed to, or collected directly by these service providers, who use this information to
            evaluate use of the website, or for advertising purposes, as described below.
          </p>

          <h2 className="text-xl font-bold text-foreground">How to turn off cookies?</h2>
          <p>
            If you do not want to accept cookies, you can change your browser settings so that cookies are not accepted. If you do this, you may
            not be able to use the cookie preferences centre. If you do this, please be aware that you may lose some of the functionality of this Website.
            For further information about cookies and how to disable them please go to www.aboutcookies.org or www.allaboutcookies.org
          </p>

          <h2 className="text-xl font-bold text-foreground">How to contact us?</h2>
          <p>
            We may update this cookie notice from time to time to reflect changes to the type of cookies and similar technology we use. We also
            encourage you to check this cookie notice on a regular basis.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">For Customers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/")} className="hover:text-foreground">Find a Professional</button></li>
                <li><button onClick={() => navigate("/")} className="hover:text-foreground">How it works</button></li>
                <li><button onClick={() => navigate("/auth/login")} className="hover:text-foreground">Login</button></li>
                <li><button onClick={() => navigate("/")} className="hover:text-foreground">Mobile App</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">For Professionals</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/")} className="hover:text-foreground">How it works</button></li>
                <li><button onClick={() => navigate("/")} className="hover:text-foreground">Pricing</button></li>
                <li><button onClick={() => navigate("/auth/welcome")} className="hover:text-foreground">Join as a Professional</button></li>
                <li><button onClick={() => navigate("/help")} className="hover:text-foreground">Help centre</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">About</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/about")} className="hover:text-foreground">About FLEX'S</button></li>
                <li><button className="hover:text-foreground">Careers</button></li>
                <li><button onClick={() => navigate("/affiliates")} className="hover:text-foreground">Affiliates</button></li>
                <li><button className="hover:text-foreground">Blog</button></li>
                <li><button className="hover:text-foreground">Press</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Need help?</h4>
              <Button size="sm" variant="outline" onClick={() => navigate("/help")}>Contact us</Button>
              <div className="flex gap-3 mt-4 text-muted-foreground">
                <span>🇨🇦 Canada ▾</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-6 text-xs text-muted-foreground">
            <p>© 2025 FLEX'S Global Limited. <button onClick={() => navigate("/cookies")} className="hover:underline">Cookie policy</button> / Privacy policy</p>
            <ManageCookiesLink className="mt-2 hover:underline" />
          </div>
        </div>
      </footer>
    </div>
  );
}
