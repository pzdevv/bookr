# Email Templates Collection

This document contains premium, responsive HTML email templates designed for **Bookr**.
Theme: Dark Ruby (`#850000`) & Gold Accents.

## 1. Booking Confirmation (Guest)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcedec; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(133, 0, 0, 0.1);">
        
        <!-- Header with Gradient -->
        <div style="background: linear-gradient(135deg, #1d0c0c 0%, #3a0d0d 100%); padding: 40px 0; text-align: center; position: relative;">
            <div style="width: 150px; hieght: 150px; background: #850000; filter: blur(80px); position: absolute; top: -50px; left: 20%; opacity: 0.4;"></div>
            <!-- Logo -->
            <div style="position: relative; z-index: 10;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -1px;">
                    <span style="color: #ff4d4d;">◆</span> Bookr
                </h1>
            </div>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background-color: #ecfdf5; color: #059669; padding: 8px 16px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 16px;">
                    ✓ Booking Confirmed
                </div>
                <h2 style="color: #1d0c0c; font-size: 24px; font-weight: 700; margin: 0 0 8px;">You're all set!</h2>
                <p style="color: #6b4444; font-size: 16px; line-height: 1.5; margin: 0;">
                    Your meeting with <strong>{{hostName}}</strong> is scheduled.
                </p>
            </div>

            <!-- Card: Meeting Details -->
            <div style="background-color: #fff9f9; border: 1px solid rgba(133, 0, 0, 0.05); border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="padding-bottom: 16px; border-bottom: 1px solid rgba(133,0,0,0.05);">
                            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #850000; font-weight: 700; margin-bottom: 4px;">Event Type</span>
                            <span style="display: block; font-size: 18px; color: #1d0c0c; font-weight: 600;">{{eventTitle}}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 16px;">
                            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #850000; font-weight: 700; margin-bottom: 4px;">When</span>
                            <span style="display: block; font-size: 16px; color: #1d0c0c; font-weight: 500;">
                                {{date}} at {{time}}
                            </span>
                            <span style="display: block; font-size: 13px; color: #6b4444; margin-top: 2px;">{{timezone}} • {{duration}} mins</span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center;">
                <a href="{{callLink}}" style="display: inline-block; background-color: #850000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(133, 0, 0, 0.2);">
                    Join Meeting Room
                </a>
                <p style="margin-top: 16px; font-size: 12px; color: #999;">
                    Button not working? Copy this link:<br>
                    <a href="{{callLink}}" style="color: #850000;">{{callLink}}</a>
                </p>
            </div>
            
            <!-- Notes Section (Conditional) -->
            <!-- [IF notes] -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed rgba(0,0,0,0.1);">
                <p style="font-size: 14px; color: #6b4444; font-style: italic;">
                    "{{notes}}"
                </p>
            </div>
            <!-- [END IF] -->
        </div>

        <!-- Footer -->
        <div style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; font-size: 12px; color: #888;">
                Powered by <strong>Bookr</strong>
            </p>
        </div>
    </div>
</body>
</html>
```

## 2. New Booking Request (Host)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Request</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcedec; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(133, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1d0c0c 0%, #3a0d0d 100%); padding: 30px 0; text-align: center;">
             <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">Bookr</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background-color: #fff7ed; color: #c2410c; padding: 6px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; border: 1px solid #ffedd5;">
                    ACTION REQUIRED
                </div>
                <h2 style="color: #1d0c0c; font-size: 22px; font-weight: 700; margin: 0;">New Booking Request</h2>
            </div>

            <div style="background-color: #fff9f9; padding: 24px; border-radius: 12px; border-left: 4px solid #850000;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #6b4444; font-weight: 600;">REQUESTED BY</p>
                <div style="font-size: 18px; color: #1d0c0c; font-weight: 700; margin-bottom: 4px;">{{guestName}}</div>
                <div style="font-size: 14px; color: #888;">{{guestEmail}}</div>
                
                <div style="height: 1px; background: rgba(0,0,0,0.05); margin: 20px 0;"></div>

                <p style="margin: 0 0 8px; font-size: 14px; color: #6b4444; font-weight: 600;">DATE & TIME</p>
                <div style="font-size: 16px; color: #1d0c0c; font-weight: 500;">{{date}}</div>
                <div style="font-size: 16px; color: #1d0c0c; font-weight: 500;">{{time}}</div>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <a href="{{dashboardLink}}" style="display: inline-block; background-color: #1d0c0c; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
                    Review Request
                </a>
            </div>
        </div>
    </div>
</body>
</html>
```

## 3. Booking Declined (Guest)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Declined</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcedec; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(133, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1d0c0c 0%, #3a0d0d 100%); padding: 30px 0; text-align: center;">
             <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">Bookr</h1>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span style="font-size: 30px;">✕</span>
            </div>
            <h2 style="color: #dc2626; font-size: 20px; font-weight: 700; margin: 0 0 16px;">Booking Declined</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                Hi <strong>{{guestName}}</strong>,<br>
                Unfortunately, <strong>{{hostName}}</strong> cannot accept your booking for <strong>{{date}}</strong>.
            </p>
            
            <!-- [IF reason] -->
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 14px; text-align: left; color: #374151;">
                <strong>Note from host:</strong><br>
                {{reason}}
            </div>
            <!-- [END IF] -->

            <div style="margin-top: 30px;">
                <a href="{{bookingLink}}" style="color: #850000; font-weight: 600; text-decoration: none;">View availability for other times &rarr;</a>
            </div>
        </div>
    </div>
</body>
</html>
```
