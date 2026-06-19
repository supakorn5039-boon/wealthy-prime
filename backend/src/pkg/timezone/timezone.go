package timezone

import "time"

// ICT is the shared Indochina Time (UTC+7) zone used for booking day
// boundaries and customer-facing date rendering.
var ICT = time.FixedZone("ICT", 7*3600)
