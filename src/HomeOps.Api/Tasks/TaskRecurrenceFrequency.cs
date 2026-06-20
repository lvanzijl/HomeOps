using System.Text.Json.Serialization;

namespace HomeOps.Api.Tasks;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TaskRecurrenceFrequency
{
    None,
    Daily,
    Weekly,
    Monthly,
}
