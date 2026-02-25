import { useAuth } from "../../context/AuthContext";

export default function Profile() {
    const { user } = useAuth();

    const avatar =
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture;

    return (
        <div className="max-w-3xl mx-auto py-16 px-4">
            <div className="bg-white shadow-lg rounded-2xl p-8">

                <div className="flex items-center gap-6">
                    <img
                        src={avatar}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover"
                    />

                    <div>
                        <h1 className="text-2xl font-bold">
                            {user?.user_metadata?.full_name}
                        </h1>
                        <p className="text-gray-500">{user?.email}</p>
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    <div>
                        <p className="text-sm text-gray-500">User ID</p>
                        <p className="font-mono text-sm">{user?.id}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Provider</p>
                        <p>{user?.app_metadata?.provider}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Last Sign In</p>
                        <p>{new Date(user?.last_sign_in_at || "").toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}